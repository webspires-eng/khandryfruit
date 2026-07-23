/**
 * Development helper: make the seeded catalogue actually sellable.
 *
 * `prisma/seed.ts` intentionally writes placeholder food-compliance copy, so
 * every seeded product fails `productPublicationBlockers` and stays DRAFT.
 * The storefront still lists DRAFT products outside production, so a cart can
 * be built from goods that checkout then rejects with PRODUCT_NOT_PUBLISHED.
 *
 * This script fills the mandatory fields with plausible development content,
 * re-runs the real readiness check, and publishes only the products that pass.
 * It never bypasses the gate — a product with a genuine blocker stays DRAFT.
 *
 * Usage: npm run db:publish-dev
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { productPublicationBlockers } from "../src/lib/commerce/publication";
import { isPlaceholder } from "../src/lib/i18n/content";

if (process.env.NODE_ENV === "production")
  throw new Error("publish-dev-products is disabled in production.");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const RESPONSIBLE_BUSINESS =
  "Khan Dry Fruit (development data), Musterstraße 1, 47051 Duisburg, Germany";

/** Per-product copy keyed by Product.internalName, with a generic fallback. */
const copy: Record<string, { de: string; en: string; image: string }> = {
  apricots: {
    de: "Getrocknete Aprikosen",
    en: "Dried apricots",
    image: "apricots.webp",
  },
  figs: { de: "Getrocknete Feigen", en: "Dried figs", image: "figs.webp" },
  "black-raisins": {
    de: "Schwarze Rosinen",
    en: "Black raisins",
    image: "black-raisins.webp",
  },
  "green-raisins": {
    de: "Grüne Rosinen",
    en: "Green raisins",
    image: "green-raisins.webp",
  },
  mulberries: {
    de: "Getrocknete Maulbeeren",
    en: "Dried mulberries",
    image: "white-mulberries.webp",
  },
  peaches: {
    de: "Getrocknete Pfirsiche",
    en: "Dried peaches",
    image: "mangoes.webp",
  },
};

const fallback = {
  de: "Getrocknete Früchte",
  en: "Dried fruit",
  image: "product-placeholder.webp",
};

async function main() {
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  const products = await db.product.findMany({
    where: { deletedAt: null },
    include: {
      translations: true,
      variants: { include: { inventory: true } },
      images: true,
      nutrition: true,
      categories: true,
      claims: true,
    },
    orderBy: { internalName: "asc" },
  });

  for (const product of products) {
    const item = copy[product.internalName] ?? fallback;

    for (const translation of product.translations) {
      const de = translation.locale === "de";
      const ingredient = de ? item.de : item.en;
      // Only overwrite fields the readiness check rejects as placeholders.
      const data: Record<string, string> = {};
      if (isPlaceholder(translation.ingredients))
        data.ingredients = de
          ? `${ingredient} 100 %. Ohne Zusatz von Zucker und ohne Konservierungsstoffe.`
          : `${ingredient} 100%. No added sugar and no preservatives.`;
      if (isPlaceholder(translation.allergenStatement))
        data.allergenStatement = de
          ? "Keine kennzeichnungspflichtigen Allergene. Kann Spuren von Schalenfrüchten enthalten, da im selben Betrieb verarbeitet."
          : "No allergens subject to labelling. May contain traces of nuts, as it is processed in the same facility.";
      if (isPlaceholder(translation.storageInstructions))
        data.storageInstructions = de
          ? "Kühl, trocken und vor Licht geschützt lagern. Nach dem Öffnen gut verschließen und innerhalb von vier Wochen verbrauchen."
          : "Store cool, dry and protected from light. Reseal after opening and consume within four weeks.";
      if (Object.keys(data).length)
        await db.productTranslation.update({
          where: { id: translation.id },
          data,
        });
    }

    if (!product.responsibleFoodBusiness || !product.countryOfOrigin)
      await db.product.update({
        where: { id: product.id },
        data: {
          responsibleFoodBusiness:
            product.responsibleFoodBusiness ?? RESPONSIBLE_BUSINESS,
          countryOfOrigin: product.countryOfOrigin ?? "Afghanistan",
        },
      });

    if (!product.nutrition)
      await db.nutritionData.create({
        data: {
          productId: product.id,
          energyKj: 1030,
          energyKcal: 244,
          fatG: 0.5,
          saturatedFatG: 0.1,
          carbohydratesG: 53.0,
          sugarsG: 47.9,
          fibreG: 7.3,
          proteinG: 3.4,
          saltG: 0.02,
        },
      });

    if (!product.images.length)
      await db.productImage.create({
        data: {
          productId: product.id,
          url: `/images/products/${item.image}`,
          altDe: `${item.de} von Khan Dry Fruit`,
          altEn: `${item.en} from Khan Dry Fruit`,
          sortOrder: 0,
          isPrimary: true,
          width: 1200,
          height: 900,
        },
      });
  }

  // Re-read and evaluate with the same rules the admin publish action uses.
  const refreshed = await db.product.findMany({
    where: { deletedAt: null },
    include: {
      translations: true,
      variants: { include: { inventory: true } },
      images: true,
      nutrition: true,
      categories: true,
      claims: true,
    },
    orderBy: { internalName: "asc" },
  });

  let published = 0;
  for (const product of refreshed) {
    const de = product.translations.find((t) => t.locale === "de");
    const en = product.translations.find((t) => t.locale === "en");
    const clean = (value?: string) =>
      value && !isPlaceholder(value) ? value : undefined;
    const blockers = productPublicationBlockers({
      germanName: de?.name,
      germanSlug: de?.slug,
      englishName: en?.name,
      englishSlug: en?.slug,
      categoryId: product.categories[0]?.categoryId,
      variants: product.variants
        .filter((variant) => variant.active)
        .map((variant) => ({
          priceCents: variant.priceCents,
          weightGrams: variant.weightGrams,
          sku: variant.sku,
          inventoryConfigured: Boolean(variant.inventory),
          available:
            (variant.inventory?.onHand ?? 0) -
            (variant.inventory?.reserved ?? 0),
          backorderAllowed: variant.inventory?.backorderAllowed ?? false,
        })),
      ingredientsDe: clean(de?.ingredients),
      allergenDe: clean(de?.allergenStatement),
      storageDe: clean(de?.storageInstructions),
      ingredientsEn: clean(en?.ingredients),
      allergenEn: clean(en?.allergenStatement),
      storageEn: clean(en?.storageInstructions),
      nutritionComplete: Boolean(product.nutrition),
      countryOfOrigin: product.countryOfOrigin ?? undefined,
      responsibleFoodBusiness: product.responsibleFoodBusiness ?? undefined,
      imageCount: product.images.length,
      seoTitleDe: de?.seoTitle,
      metaDescriptionDe: de?.metaDescription,
      seoTitleEn: en?.seoTitle,
      metaDescriptionEn: en?.metaDescription,
      claims: product.claims.map((claim) => ({
        enabled: claim.enabled,
        verified: claim.verified,
      })),
    });
    const name = en?.name ?? product.internalName;
    if (blockers.length) {
      console.warn(`SKIPPED  ${name} — still blocked: ${blockers.join(", ")}`);
      continue;
    }
    await db.product.update({
      where: { id: product.id },
      data: {
        status: "ACTIVE",
        publishedAt: product.publishedAt ?? new Date(),
      },
    });
    published += 1;
    console.info(`PUBLISHED ${name}`);
  }

  console.info(`\n${published}/${refreshed.length} products are now ACTIVE.`);
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
