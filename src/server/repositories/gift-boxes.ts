import "server-only";

import type { AppLocale } from "@/config/site";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import type {
  GiftBoxBuilderProduct,
  GiftBoxBuilderTemplate,
  GiftBoxCatalogueItem,
  GiftBoxPackagingChoice,
} from "@/types/gift-box";

/** Slots one pack occupies: 1kg packs take two slots, everything else one. */
export function variantCapacityUnits(weightGrams: number): number {
  return weightGrams >= 1000 ? 2 : 1;
}

const shouldUseFallback = () => !env.DATABASE_URL;

/** True when gift-box data comes from the development fallback, not the DB. */
export const giftBoxFallbackActive = () => shouldUseFallback();

// ---------------------------------------------------------------------------
// Development fallback (mirrors the catalogue repository pattern): keeps the
// gift-box pages browsable without a database. Configurations can NOT be
// persisted in this mode — add-to-cart requires a database.
// ---------------------------------------------------------------------------

const fallbackTemplates: Array<
  GiftBoxBuilderTemplate & { nameDe: string; nameEn: string }
> = [
  {
    id: "dev-box-small",
    name: "",
    nameDe: "Kleine Geschenkbox",
    nameEn: "Small gift box",
    sizeName: "SMALL",
    capacityUnits: 3,
    minItems: 2,
    maxItems: 3,
    boxChargeCents: 399,
    active: true,
  },
  {
    id: "dev-box-medium",
    name: "",
    nameDe: "Mittlere Geschenkbox",
    nameEn: "Medium gift box",
    sizeName: "MEDIUM",
    capacityUnits: 5,
    minItems: 3,
    maxItems: 5,
    boxChargeCents: 599,
    active: true,
  },
  {
    id: "dev-box-large",
    name: "",
    nameDe: "Große Geschenkbox",
    nameEn: "Large gift box",
    sizeName: "LARGE",
    capacityUnits: 8,
    minItems: 4,
    maxItems: 8,
    boxChargeCents: 799,
    active: true,
  },
];

const fallbackPackaging: Array<
  Omit<GiftBoxPackagingChoice, "name" | "description"> & {
    nameDe: string;
    nameEn: string;
    descriptionDe: string;
    descriptionEn: string;
  }
> = [
  {
    id: "dev-packaging-standard",
    nameDe: "Klassische Box",
    nameEn: "Classic box",
    descriptionDe: "Stabile Geschenkbox mit Seidenpapier.",
    descriptionEn: "Sturdy gift box with tissue paper.",
    priceCents: 0,
    active: true,
  },
  {
    id: "dev-packaging-premium",
    nameDe: "Premium-Verpackung",
    nameEn: "Premium wrap",
    descriptionDe: "Geschenkband, Karte und festliche Verpackung.",
    descriptionEn: "Ribbon, card and festive wrapping.",
    priceCents: 490,
    active: true,
  },
];

const fallbackFixedBoxes: Array<{
  id: string;
  slugDe: string;
  slugEn: string;
  nameDe: string;
  nameEn: string;
  descriptionDe: string;
  descriptionEn: string;
  sizeName: string;
  occasions: string[];
  boxChargeCents: number;
  items: Array<{
    devProductId: string;
    devVariantId: string;
    nameDe: string;
    nameEn: string;
    weightGrams: number;
    priceCents: number;
    quantity: number;
  }>;
}> = [
  {
    id: "dev-box-classic",
    slugDe: "klassische-auswahl",
    slugEn: "classic-selection",
    nameDe: "Klassische Auswahl",
    nameEn: "Classic Selection",
    descriptionDe:
      "Unsere beliebtesten Trockenfrüchte in einer festlichen Box – Rosinen aus Kabul, Feigen aus Kandahar und Maulbeeren aus Shamali.",
    descriptionEn:
      "Our most popular dry fruits in a festive box – raisins from Kabul, figs from Kandahar and mulberries from Shamali.",
    sizeName: "MEDIUM",
    occasions: ["EID", "GENERAL", "THANK_YOU"],
    boxChargeCents: 599,
    items: [
      {
        devProductId: "dev-black-raisins",
        devVariantId: "dev-black-500",
        nameDe: "Schwarze Rosinen",
        nameEn: "Black Raisins",
        weightGrams: 500,
        priceCents: 899,
        quantity: 1,
      },
      {
        devProductId: "dev-figs",
        devVariantId: "dev-figs-500",
        nameDe: "Afghanische Feigen",
        nameEn: "Afghan Figs",
        weightGrams: 500,
        priceCents: 1299,
        quantity: 1,
      },
      {
        devProductId: "dev-mulberries",
        devVariantId: "dev-mulberries-500",
        nameDe: "Getrocknete Maulbeeren",
        nameEn: "Dried Mulberries",
        weightGrams: 500,
        priceCents: 1099,
        quantity: 1,
      },
    ],
  },
];

function localizedTemplateName(
  template: (typeof fallbackTemplates)[number],
  locale: AppLocale,
) {
  return locale === "de" ? template.nameDe : template.nameEn;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const statusFilter = () =>
  env.NODE_ENV === "production" ? { active: true } : {};

function mapCatalogueItem(
  record: {
    id: string;
    slugDe: string;
    slugEn: string;
    nameDe: string;
    nameEn: string;
    descriptionDe: string;
    descriptionEn: string;
    seoTitleDe: string;
    seoTitleEn: string;
    metaDescriptionDe: string;
    metaDescriptionEn: string;
    imageUrl: string | null;
    sizeName: string;
    occasions: string[];
    active: boolean;
    basePriceCents: number;
    items: Array<{
      productId: string;
      variantId: string;
      quantity: number;
      variant: {
        priceCents: number;
        weightGrams: number;
        active: boolean;
        inventory: { onHand: number; reserved: number } | null;
      };
      product: {
        translations: Array<{ locale: string; name: string }>;
      };
    }>;
  },
  locale: AppLocale,
): GiftBoxCatalogueItem {
  const de = locale === "de";
  const itemsTotal = record.items.reduce(
    (sum, item) => sum + item.variant.priceCents * item.quantity,
    0,
  );
  const available = record.items.every(
    (item) =>
      item.variant.active &&
      (item.variant.inventory?.onHand ?? 0) -
        (item.variant.inventory?.reserved ?? 0) >=
        item.quantity,
  );
  return {
    id: record.id,
    slug: de ? record.slugDe : record.slugEn,
    name: de ? record.nameDe : record.nameEn,
    description: de ? record.descriptionDe : record.descriptionEn,
    seoTitle: de ? record.seoTitleDe : record.seoTitleEn,
    metaDescription: de ? record.metaDescriptionDe : record.metaDescriptionEn,
    imageUrl: record.imageUrl,
    sizeName: record.sizeName,
    occasions: record.occasions,
    fixed: true,
    status: record.active ? "ACTIVE" : "DRAFT",
    boxChargeCents: record.basePriceCents,
    priceCents: record.basePriceCents + itemsTotal,
    available,
    items: record.items.map((item) => {
      const translation =
        item.product.translations.find((entry) => entry.locale === locale) ??
        item.product.translations[0];
      return {
        productId: item.productId,
        variantId: item.variantId,
        productName: translation?.name ?? "",
        weightGrams: item.variant.weightGrams,
        quantity: item.quantity,
      };
    }),
    alternateSlugs: { de: record.slugDe, en: record.slugEn },
  };
}

function fallbackCatalogueItems(locale: AppLocale): GiftBoxCatalogueItem[] {
  const de = locale === "de";
  return fallbackFixedBoxes.map((box) => ({
    id: box.id,
    slug: de ? box.slugDe : box.slugEn,
    name: de ? box.nameDe : box.nameEn,
    description: de ? box.descriptionDe : box.descriptionEn,
    seoTitle: `${de ? box.nameDe : box.nameEn} | Khan Dry Fruit`,
    metaDescription: de ? box.descriptionDe : box.descriptionEn,
    imageUrl: null,
    sizeName: box.sizeName,
    occasions: box.occasions,
    fixed: true,
    status: "DRAFT",
    boxChargeCents: box.boxChargeCents,
    priceCents:
      box.boxChargeCents +
      box.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
    available: true,
    items: box.items.map((item) => ({
      productId: item.devProductId,
      variantId: item.devVariantId,
      productName: de ? item.nameDe : item.nameEn,
      weightGrams: item.weightGrams,
      quantity: item.quantity,
    })),
    alternateSlugs: { de: box.slugDe, en: box.slugEn },
  }));
}

export async function getFixedGiftBoxes(
  locale: AppLocale,
): Promise<GiftBoxCatalogueItem[]> {
  if (shouldUseFallback()) return fallbackCatalogueItems(locale);
  try {
    const records = await db.giftBox.findMany({
      where: { fixed: true, ...statusFilter() },
      include: {
        items: {
          include: {
            variant: { include: { inventory: true } },
            product: { include: { translations: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return records.map((record) => mapCatalogueItem(record, locale));
  } catch (error) {
    if (env.NODE_ENV === "production") throw error;
    return fallbackCatalogueItems(locale);
  }
}

export async function getGiftBoxBySlug(
  locale: AppLocale,
  slug: string,
): Promise<GiftBoxCatalogueItem | null> {
  const boxes = await getFixedGiftBoxes(locale);
  return (
    boxes.find(
      (box) =>
        box.slug === slug || Object.values(box.alternateSlugs).includes(slug),
    ) ?? null
  );
}

export async function getBuilderTemplates(
  locale: AppLocale,
): Promise<GiftBoxBuilderTemplate[]> {
  if (shouldUseFallback())
    return fallbackTemplates.map((template) => ({
      ...template,
      name: localizedTemplateName(template, locale),
    }));
  try {
    const records = await db.giftBox.findMany({
      where: { fixed: false, active: true },
      orderBy: { capacityUnits: "asc" },
    });
    return records.map((record) => ({
      id: record.id,
      name: locale === "de" ? record.nameDe : record.nameEn,
      sizeName: record.sizeName,
      capacityUnits: record.capacityUnits,
      minItems: record.minItems,
      maxItems: record.maxItems,
      boxChargeCents: record.basePriceCents,
      active: record.active,
    }));
  } catch (error) {
    if (env.NODE_ENV === "production") throw error;
    return fallbackTemplates.map((template) => ({
      ...template,
      name: localizedTemplateName(template, locale),
    }));
  }
}

export async function getPackagingOptions(
  locale: AppLocale,
): Promise<GiftBoxPackagingChoice[]> {
  const de = locale === "de";
  if (shouldUseFallback())
    return fallbackPackaging.map((option) => ({
      id: option.id,
      name: de ? option.nameDe : option.nameEn,
      description: de ? option.descriptionDe : option.descriptionEn,
      priceCents: option.priceCents,
      active: option.active,
    }));
  try {
    const records = await db.giftPackagingOption.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return records.map((record) => ({
      id: record.id,
      name: de ? record.nameDe : record.nameEn,
      description: de ? record.descriptionDe : record.descriptionEn,
      priceCents: record.priceCents,
      active: record.active,
    }));
  } catch (error) {
    if (env.NODE_ENV === "production") throw error;
    return fallbackPackaging.map((option) => ({
      id: option.id,
      name: de ? option.nameDe : option.nameEn,
      description: de ? option.descriptionDe : option.descriptionEn,
      priceCents: option.priceCents,
      active: option.active,
    }));
  }
}

/**
 * Products eligible for the build-your-own flow: gift-suitable, published
 * (drafts allowed outside production, mirroring the catalogue), with active
 * variants and live stock figures.
 */
export async function getBuilderProducts(
  locale: AppLocale,
): Promise<GiftBoxBuilderProduct[]> {
  if (shouldUseFallback()) {
    const { getProducts } = await import("@/server/repositories/catalogue");
    const products = await getProducts(locale);
    return products.map((product) => ({
      productId: product.id,
      name: product.name,
      category: product.category,
      image: product.image,
      imageAlt: product.imageAlt,
      status: product.status,
      variants: product.variants.map((variant) => ({
        variantId: variant.id,
        weightGrams: variant.weightGrams,
        priceCents: variant.priceCents,
        available: variant.available,
        capacityUnits: variantCapacityUnits(variant.weightGrams),
      })),
    }));
  }
  try {
    const records = await db.product.findMany({
      where: {
        deletedAt: null,
        giftSuitable: true,
        status:
          env.NODE_ENV === "production"
            ? "ACTIVE"
            : { in: ["ACTIVE", "DRAFT"] },
      },
      include: {
        translations: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
        },
        variants: {
          where: { active: true },
          include: { inventory: true },
          orderBy: { weightGrams: "asc" },
        },
        categories: {
          include: {
            category: { include: { translations: { where: { locale } } } },
          },
        },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
    });
    return records.flatMap((record) => {
      const translation =
        record.translations.find((entry) => entry.locale === locale) ??
        record.translations[0];
      if (!translation || record.variants.length === 0) return [];
      return [
        {
          productId: record.id,
          name: translation.name,
          category: record.categories[0]?.category.translations[0]?.name ?? "",
          image:
            record.images[0]?.url ??
            "/images/products/product-placeholder.webp",
          imageAlt:
            locale === "de"
              ? (record.images[0]?.altDe ?? translation.name)
              : (record.images[0]?.altEn ?? translation.name),
          status:
            record.status === "ACTIVE"
              ? ("ACTIVE" as const)
              : ("DRAFT" as const),
          variants: record.variants.map((variant) => ({
            variantId: variant.id,
            weightGrams: variant.weightGrams,
            priceCents: variant.priceCents,
            available:
              (variant.inventory?.onHand ?? 0) -
              (variant.inventory?.reserved ?? 0),
            capacityUnits: variantCapacityUnits(variant.weightGrams),
          })),
        },
      ];
    });
  } catch (error) {
    if (env.NODE_ENV === "production") throw error;
    return [];
  }
}
