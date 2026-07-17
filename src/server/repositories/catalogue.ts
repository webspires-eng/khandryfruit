import "server-only";

import type { AppLocale } from "@/config/site";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import {
  isCompleteProductTranslation,
  placeholderCopy,
  resolveLocaleRecord,
} from "@/lib/i18n/content";
import type { CatalogueProduct } from "@/types/commerce";

type DevelopmentProduct = {
  key: string;
  nameDe: string;
  nameEn: string;
  slugDe: string;
  slugEn: string;
  categoryDe: string;
  categoryEn: string;
  categorySlugDe: string;
  categorySlugEn: string;
  image: string;
  altDe: string;
  altEn: string;
  priceCents: number;
  bestseller?: boolean;
};

const developmentCatalogue: DevelopmentProduct[] = [
  {
    key: "apricots",
    nameDe: "Aprikosen",
    nameEn: "Apricots",
    slugDe: "aprikosen",
    slugEn: "apricots",
    categoryDe: "Aprikosen",
    categoryEn: "Apricots",
    categorySlugDe: "aprikosen",
    categorySlugEn: "apricots",
    image: "/images/products/apricots.webp",
    altDe: "Reife Aprikosen in einer blauen Schale",
    altEn: "Ripe apricots in a blue bowl",
    priceCents: 999,
    bestseller: true,
  },
  {
    key: "figs",
    nameDe: "Feigen",
    nameEn: "Figs",
    slugDe: "feigen",
    slugEn: "figs",
    categoryDe: "Feigen",
    categoryEn: "Figs",
    categorySlugDe: "feigen",
    categorySlugEn: "figs",
    image: "/images/products/figs.webp",
    altDe: "Getrocknete Feigen in einer rustikalen Schale",
    altEn: "Dried figs in a rustic bowl",
    priceCents: 1299,
    bestseller: true,
  },
  {
    key: "mangoes",
    nameDe: "Mangos",
    nameEn: "Mangoes",
    slugDe: "mangos",
    slugEn: "mangoes",
    categoryDe: "Mangos",
    categoryEn: "Mangoes",
    categorySlugDe: "mangos",
    categorySlugEn: "mangoes",
    image: "/images/products/mangoes.webp",
    altDe: "Reife Mangos in einem Korb",
    altEn: "Ripe mangoes in a basket",
    priceCents: 1199,
  },
  {
    key: "black-raisins",
    nameDe: "Schwarze Rosinen",
    nameEn: "Black Raisins",
    slugDe: "schwarze-rosinen",
    slugEn: "black-raisins",
    categoryDe: "Rosinen",
    categoryEn: "Raisins",
    categorySlugDe: "rosinen",
    categorySlugEn: "raisins",
    image: "/images/products/black-raisins.webp",
    altDe: "Nahaufnahme schwarzer Rosinen",
    altEn: "Close-up of black raisins",
    priceCents: 899,
    bestseller: true,
  },
  {
    key: "green-raisins",
    nameDe: "Grüne Rosinen",
    nameEn: "Green Raisins",
    slugDe: "gruene-rosinen",
    slugEn: "green-raisins",
    categoryDe: "Rosinen",
    categoryEn: "Raisins",
    categorySlugDe: "rosinen",
    categorySlugEn: "raisins",
    image: "/images/products/green-raisins.webp",
    altDe: "Grüne Rosinen in einem Glasgefäß",
    altEn: "Green raisins in a glass jar",
    priceCents: 999,
  },
  {
    key: "brown-raisins",
    nameDe: "Braune Rosinen",
    nameEn: "Brown Raisins",
    slugDe: "braune-rosinen",
    slugEn: "brown-raisins",
    categoryDe: "Rosinen",
    categoryEn: "Raisins",
    categorySlugDe: "rosinen",
    categorySlugEn: "raisins",
    image: "/images/products/brown-raisins.webp",
    altDe: "Braune Rosinen in warmer Nahaufnahme",
    altEn: "Brown raisins in a warm close-up",
    priceCents: 949,
  },
  {
    key: "chickpeas",
    nameDe: "Kichererbsen",
    nameEn: "Chickpeas",
    slugDe: "kichererbsen",
    slugEn: "chickpeas",
    categoryDe: "Hülsenfrüchte",
    categoryEn: "Pulses",
    categorySlugDe: "huelsenfruechte",
    categorySlugEn: "pulses",
    image: "/images/products/chickpeas.webp",
    altDe: "Kichererbsen in einer dunklen Schale",
    altEn: "Chickpeas in a dark bowl",
    priceCents: 699,
  },
  {
    key: "almonds",
    nameDe: "Mandeln",
    nameEn: "Almonds",
    slugDe: "mandeln",
    slugEn: "almonds",
    categoryDe: "Nüsse",
    categoryEn: "Nuts",
    categorySlugDe: "nuesse",
    categorySlugEn: "nuts",
    image: "/images/products/almonds.webp",
    altDe: "Ganze Mandeln in Nahaufnahme",
    altEn: "Whole almonds in close-up",
    priceCents: 1399,
    bestseller: true,
  },
  {
    key: "pistachios",
    nameDe: "Pistazien",
    nameEn: "Pistachios",
    slugDe: "pistazien",
    slugEn: "pistachios",
    categoryDe: "Nüsse",
    categoryEn: "Nuts",
    categorySlugDe: "nuesse",
    categorySlugEn: "nuts",
    image: "/images/products/pistachios.webp",
    altDe: "Pistazien in einer Keramikschale",
    altEn: "Pistachios in a ceramic bowl",
    priceCents: 1599,
  },
  {
    key: "black-mulberries",
    nameDe: "Schwarze Maulbeeren",
    nameEn: "Black Mulberries",
    slugDe: "schwarze-maulbeeren",
    slugEn: "black-mulberries",
    categoryDe: "Maulbeeren",
    categoryEn: "Mulberries",
    categorySlugDe: "maulbeeren",
    categorySlugEn: "mulberries",
    image: "/images/products/black-mulberries.webp",
    altDe: "Schwarze Maulbeeren auf einem Teller",
    altEn: "Black mulberries on a plate",
    priceCents: 1199,
  },
  {
    key: "white-mulberries",
    nameDe: "Weiße Maulbeeren",
    nameEn: "White Mulberries",
    slugDe: "weisse-maulbeeren",
    slugEn: "white-mulberries",
    categoryDe: "Maulbeeren",
    categoryEn: "Mulberries",
    categorySlugDe: "maulbeeren",
    categorySlugEn: "mulberries",
    image: "/images/products/white-mulberries.webp",
    altDe: "Weiße Maulbeeren in Nahaufnahme",
    altEn: "White mulberries in close-up",
    priceCents: 1099,
  },
  {
    key: "jujubes",
    nameDe: "Jujuben",
    nameEn: "Jujubes",
    slugDe: "jujuben",
    slugEn: "jujubes",
    categoryDe: "Jujuben",
    categoryEn: "Jujubes",
    categorySlugDe: "jujuben",
    categorySlugEn: "jujubes",
    image: "/images/products/jujubes.webp",
    altDe: "Getrocknete rote Jujuben auf einem Teller",
    altEn: "Dried red jujubes on a plate",
    priceCents: 1099,
  },
  {
    key: "cashews",
    nameDe: "Cashewkerne",
    nameEn: "Cashews",
    slugDe: "cashewkerne",
    slugEn: "cashews",
    categoryDe: "Nüsse",
    categoryEn: "Nuts",
    categorySlugDe: "nuesse",
    categorySlugEn: "nuts",
    image: "/images/products/cashews.webp",
    altDe: "Cashewkerne als flächige Nahaufnahme",
    altEn: "Cashews arranged in a close-up",
    priceCents: 1499,
  },
];

function createDevelopmentProduct(
  product: DevelopmentProduct,
  locale: AppLocale,
): CatalogueProduct {
  const de = locale === "de";
  const name = de ? product.nameDe : product.nameEn;
  const unconfirmed = de ? "Noch zu bestätigen" : "To be confirmed";
  return {
    id: `dev-${product.key}`,
    slug: de ? product.slugDe : product.slugEn,
    name,
    shortDescription: de
      ? `${name} als sorgfältig präsentierter Entwurf für das Sortiment von Khan Dry Fruit.`
      : `${name} presented as a carefully prepared draft for the Khan Dry Fruit range.`,
    description: placeholderCopy[locale].productInformation,
    ingredients: placeholderCopy[locale].ingredients,
    allergenStatement: placeholderCopy[locale].allergens,
    storageInstructions: placeholderCopy[locale].storage,
    originCountry: unconfirmed,
    originRegion: unconfirmed,
    image: product.image,
    imageAlt: de ? product.altDe : product.altEn,
    category: de ? product.categoryDe : product.categoryEn,
    categorySlug: de ? product.categorySlugDe : product.categorySlugEn,
    featured: true,
    bestseller: Boolean(product.bestseller),
    status: "DRAFT",
    alternateSlugs: { de: product.slugDe, en: product.slugEn },
    variants: [
      {
        id: `dev-${product.key}-500`,
        sku: `DEV-${product.key.toUpperCase()}-500`,
        weightGrams: 500,
        priceCents: product.priceCents,
        vatRateBps: 700,
        available: 20,
        active: true,
      },
      {
        id: `dev-${product.key}-1000`,
        sku: `DEV-${product.key.toUpperCase()}-1000`,
        weightGrams: 1000,
        priceCents: Math.round(product.priceCents * 1.8),
        vatRateBps: 700,
        available: 8,
        active: true,
      },
    ],
  };
}

export async function getProducts(
  locale: AppLocale,
  options?: {
    category?: string;
    query?: string;
    featured?: boolean;
    bestseller?: boolean;
  },
) {
  if (!env.DATABASE_URL)
    return filterDevelopment(
      developmentCatalogue.map((product) =>
        createDevelopmentProduct(product, locale),
      ),
      options,
    );
  try {
    const records = await db.product.findMany({
      where: {
        deletedAt: null,
        status:
          env.NODE_ENV === "production"
            ? "ACTIVE"
            : { in: ["ACTIVE", "DRAFT"] },
        featured: options?.featured || undefined,
        bestseller: options?.bestseller || undefined,
        translations: options?.query
          ? {
              some: {
                locale,
                OR: [
                  { name: { contains: options.query, mode: "insensitive" } },
                  { keywords: { has: options.query } },
                ],
              },
            }
          : undefined,
        categories: options?.category
          ? {
              some: {
                category: {
                  translations: { some: { locale, slug: options.category } },
                },
              },
            }
          : undefined,
      },
      include: {
        translations: true,
        variants: {
          where: { active: true },
          include: { inventory: true },
          orderBy: { weightGrams: "asc" },
        },
        images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        categories: {
          include: {
            category: { include: { translations: { where: { locale } } } },
          },
        },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    });
    return records.flatMap((record) => {
      const tr = resolveLocaleRecord(record.translations, locale);
      if (!tr) return [];
      if (env.NODE_ENV === "production" && !isCompleteProductTranslation(tr))
        return [];
      const category = record.categories[0]?.category.translations[0];
      return [
        {
          id: record.id,
          slug: tr.slug,
          name: tr.name,
          shortDescription: tr.shortDescription,
          description: tr.description,
          ingredients: tr.ingredients,
          allergenStatement: tr.allergenStatement,
          storageInstructions: tr.storageInstructions,
          originCountry: record.countryOfOrigin ?? "",
          originRegion: record.regionOfOrigin ?? "",
          responsibleFoodBusiness: record.responsibleFoodBusiness ?? undefined,
          image:
            record.images[0]?.url ??
            "/images/products/product-placeholder.webp",
          imageAlt:
            locale === "de"
              ? (record.images[0]?.altDe ?? tr.name)
              : (record.images[0]?.altEn ?? tr.name),
          alternateSlugs: Object.fromEntries(
            record.translations.map((translation) => [
              translation.locale,
              translation.slug,
            ]),
          ),
          category: category?.name ?? "",
          categorySlug: category?.slug ?? "",
          featured: record.featured,
          bestseller: record.bestseller,
          status:
            record.status === "ACTIVE"
              ? ("ACTIVE" as const)
              : ("DRAFT" as const),
          variants: record.variants.map((variant) => ({
            id: variant.id,
            sku: variant.sku,
            weightGrams: variant.weightGrams,
            priceCents: variant.priceCents,
            vatRateBps: variant.vatRateBps,
            available:
              (variant.inventory?.onHand ?? 0) -
              (variant.inventory?.reserved ?? 0),
            active: variant.active,
          })),
        },
      ];
    });
  } catch (error) {
    if (env.NODE_ENV === "production") throw error;
    return filterDevelopment(
      developmentCatalogue.map((product) =>
        createDevelopmentProduct(product, locale),
      ),
      options,
    );
  }
}

function filterDevelopment(
  products: CatalogueProduct[],
  options?: {
    category?: string;
    query?: string;
    featured?: boolean;
    bestseller?: boolean;
  },
) {
  return products.filter((product) => {
    if (options?.category && product.categorySlug !== options.category)
      return false;
    if (options?.featured && !product.featured) return false;
    if (options?.bestseller && !product.bestseller) return false;
    if (
      options?.query &&
      !`${product.name} ${product.shortDescription} ${product.category}`
        .toLowerCase()
        .includes(options.query.toLowerCase())
    )
      return false;
    return true;
  });
}

export async function getProductBySlug(locale: AppLocale, slug: string) {
  return (
    (await getProducts(locale)).find((product) => product.slug === slug) ?? null
  );
}

export async function getVariantsByIds(locale: AppLocale, ids: string[]) {
  const products = await getProducts(locale);
  return products
    .flatMap((product) =>
      product.variants.map((variant) => ({ product, variant })),
    )
    .filter(({ variant }) => ids.includes(variant.id));
}
