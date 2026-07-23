import "server-only";

import type { AppLocale } from "@/config/site";
import {
  calculateGiftBoxPricing,
  GiftBoxValidationError,
  validateGiftBoxSelection,
  type GiftBoxEligibleVariant,
  type GiftBoxSelection,
} from "@/lib/commerce/gift-box";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import type { GiftBoxConfigurationInput } from "@/lib/validation/schemas";
import {
  getBuilderProducts,
  getBuilderTemplates,
  getGiftBoxBySlug,
  getPackagingOptions,
  giftBoxFallbackActive,
  variantCapacityUnits,
} from "@/server/repositories/gift-boxes";
import { CommerceError } from "@/server/services/checkout";
import type { GiftBoxCartLine } from "@/types/gift-box";

const CONFIGURATION_TTL_DAYS = 30;

export type GiftBoxCheckoutLine = {
  configurationId: string;
  quantity: number;
  name: string;
  sizeName: string;
  packagingName: string | null;
  giftMessage: string | null;
  occasion: string | null;
  unitPriceCents: number;
  taxCents: number;
  weightGrams: number;
  snapshot: {
    giftBoxId: string;
    boxChargeCents: number;
    packagingCents: number;
    itemsTotalCents: number;
    items: Array<{
      productId: string;
      variantId: string;
      name: string;
      weightGrams: number;
      quantity: number;
      unitPriceCents: number;
    }>;
  };
  /** Constituent stock to reserve at checkout. */
  stockLines: Array<{ variantId: string; quantity: number }>;
};

/** Eligible variants sourced from the development fallback catalogue. */
async function fallbackVariants(
  locale: AppLocale,
  selections: GiftBoxSelection[],
): Promise<GiftBoxEligibleVariant[]> {
  const wanted = new Set(selections.map((item) => item.variantId));
  const products = await getBuilderProducts(locale);
  return products.flatMap((product) =>
    product.variants
      .filter((variant) => wanted.has(variant.variantId))
      .map((variant) => ({
        variantId: variant.variantId,
        productId: product.productId,
        name: product.name,
        weightGrams: variant.weightGrams,
        priceCents: variant.priceCents,
        vatRateBps: 700,
        available: variant.available,
        capacityUnits: variant.capacityUnits,
        eligible: true,
      })),
  );
}

async function dbVariantsByIds(
  locale: AppLocale,
  variantIds: string[],
): Promise<GiftBoxEligibleVariant[]> {
  const records = await db.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      inventory: true,
      product: { include: { translations: true } },
    },
  });
  return records.map((variant) => {
    const translation =
      variant.product.translations.find((entry) => entry.locale === locale) ??
      variant.product.translations[0];
    const published =
      env.NODE_ENV === "production"
        ? variant.product.status === "ACTIVE"
        : variant.product.status === "ACTIVE" ||
          variant.product.status === "DRAFT";
    return {
      variantId: variant.id,
      productId: variant.productId,
      name: translation?.name ?? variant.sku,
      weightGrams: variant.weightGrams,
      priceCents: variant.priceCents,
      vatRateBps: variant.vatRateBps,
      available:
        (variant.inventory?.onHand ?? 0) - (variant.inventory?.reserved ?? 0),
      capacityUnits: variantCapacityUnits(variant.weightGrams),
      eligible:
        variant.active &&
        published &&
        variant.product.deletedAt === null &&
        variant.product.giftSuitable,
    };
  });
}

/**
 * Validate and price a build-your-own configuration entirely from
 * database-controlled data, then persist it so the cart and checkout can
 * reference an immutable, server-priced configuration.
 */
export async function createGiftBoxConfiguration(
  input: GiftBoxConfigurationInput,
  userId?: string | null,
): Promise<GiftBoxCartLine> {
  const fallback = giftBoxFallbackActive();

  const [templates, packagingOptions] = await Promise.all([
    getBuilderTemplates(input.locale),
    getPackagingOptions(input.locale),
  ]);
  const template = templates.find((entry) => entry.id === input.giftBoxId);
  if (!template) throw new GiftBoxValidationError("TEMPLATE_UNAVAILABLE");
  const packaging = input.packagingOptionId
    ? (packagingOptions.find(
        (entry) => entry.id === input.packagingOptionId,
      ) ?? {
        id: input.packagingOptionId,
        priceCents: 0,
        active: false,
      })
    : null;

  const selections: GiftBoxSelection[] = input.items;
  const variants = fallback
    ? await fallbackVariants(input.locale, selections)
    : await dbVariantsByIds(
        input.locale,
        selections.map((item) => item.variantId),
      );

  const commerceTemplate = {
    id: template.id,
    sizeName: template.sizeName,
    basePriceCents: template.boxChargeCents,
    capacityUnits: template.capacityUnits,
    minItems: template.minItems,
    maxItems: template.maxItems,
    active: template.active,
  };
  validateGiftBoxSelection({
    template: commerceTemplate,
    selections,
    variants,
    packaging,
    giftMessage: input.giftMessage ?? null,
  });
  const pricing = calculateGiftBoxPricing({
    template: commerceTemplate,
    selections,
    variants,
    packaging,
  });

  // Development fallback: prices are still computed server-side, but the
  // configuration is not persisted (checkout is disabled in this mode too).
  const configurationId = fallback
    ? `dev-${crypto.randomUUID()}`
    : (
        await db.giftBoxConfiguration.create({
          data: {
            giftBoxId: template.id,
            userId: userId ?? null,
            sizeName: template.sizeName,
            capacityUnits: template.capacityUnits,
            packagingOptionId: packaging?.active ? packaging.id : null,
            giftMessage: input.giftMessage || null,
            occasion: input.occasion ?? null,
            itemsTotalCents: pricing.itemsTotalCents,
            boxChargeCents: pricing.boxChargeCents,
            packagingCents: pricing.packagingCents,
            totalCents: pricing.totalCents,
            status: "IN_CART",
            expiresAt: new Date(
              Date.now() + CONFIGURATION_TTL_DAYS * 24 * 60 * 60_000,
            ),
            items: {
              create: pricing.lines.map((line) => ({
                productId: line.productId,
                variantId: line.variantId,
                quantity: line.quantity,
                capacityUnits: line.capacityUnits,
                unitPriceCents: line.unitPriceCents,
              })),
            },
          },
        })
      ).id;

  const packagingChoice = packaging?.active
    ? (packagingOptions.find((entry) => entry.id === packaging.id) ?? null)
    : null;
  return {
    configurationId,
    giftBoxId: template.id,
    name: template.name,
    sizeName: template.sizeName,
    packagingName: packagingChoice?.name ?? null,
    giftMessage: input.giftMessage || null,
    occasion: input.occasion ?? null,
    totalCents: pricing.totalCents,
    quantity: 1,
    items: pricing.lines.map((line) => ({
      name: line.name,
      weightGrams: line.weightGrams,
      quantity: line.quantity,
    })),
  };
}

/**
 * Snapshot a fixed gift box into a configuration at current database prices
 * so fixed and custom boxes flow through the same cart/checkout pipeline.
 */
export async function createFixedGiftBoxConfiguration(input: {
  locale: AppLocale;
  slug: string;
  giftMessage?: string;
  occasion?: string;
  packagingOptionId?: string;
}): Promise<GiftBoxCartLine> {
  const fallback = giftBoxFallbackActive();
  const [box, packagingOptions] = await Promise.all([
    getGiftBoxBySlug(input.locale, input.slug),
    getPackagingOptions(input.locale),
  ]);
  if (!box || (env.NODE_ENV === "production" && box.status !== "ACTIVE"))
    throw new GiftBoxValidationError("TEMPLATE_UNAVAILABLE");
  // Curated boxes take the same packaging choice as the builder. An id that is
  // not on the live list resolves to an inactive stub, so pricing rejects it
  // rather than silently charging nothing for it.
  const packaging = input.packagingOptionId
    ? (packagingOptions.find(
        (entry) => entry.id === input.packagingOptionId,
      ) ?? {
        id: input.packagingOptionId,
        name: "",
        priceCents: 0,
        active: false,
      })
    : null;
  // The fixed path skips the builder's capacity validation, which is also where
  // packaging availability is asserted — check it here, or a forged id would be
  // accepted and priced at zero.
  if (packaging && !packaging.active)
    throw new GiftBoxValidationError("PACKAGING_UNAVAILABLE");
  if (input.giftMessage && input.giftMessage.length > 240)
    throw new GiftBoxValidationError("MESSAGE_TOO_LONG", { max: 240 });

  // Development fallback: the catalogue price is server-derived; no
  // configuration row is written (checkout is disabled in this mode too).
  if (fallback) {
    if (!box.available)
      throw new GiftBoxValidationError("TEMPLATE_UNAVAILABLE");
    return {
      configurationId: `dev-${crypto.randomUUID()}`,
      giftBoxId: box.id,
      name: box.name,
      sizeName: box.sizeName,
      packagingName: packaging?.name || null,
      giftMessage: input.giftMessage || null,
      occasion: input.occasion ?? null,
      totalCents: box.priceCents + (packaging?.priceCents ?? 0),
      quantity: 1,
      items: box.items.map((item) => ({
        name: item.productName,
        weightGrams: item.weightGrams,
        quantity: item.quantity,
      })),
    };
  }

  const selections = box.items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
  }));
  const variants = await dbVariantsByIds(
    input.locale,
    selections.map((item) => item.variantId),
  );
  // Fixed contents are curated by the admin; enforce stock, message length
  // and availability but not builder min/max rules.
  for (const selection of selections) {
    const variant = variants.find(
      (entry) => entry.variantId === selection.variantId,
    );
    if (!variant || !variant.eligible)
      throw new GiftBoxValidationError("PRODUCT_INELIGIBLE", {
        variantId: selection.variantId,
      });
    if (selection.quantity > variant.available)
      throw new GiftBoxValidationError("INSUFFICIENT_STOCK", {
        name: variant.name,
        available: variant.available,
      });
  }

  const pricing = calculateGiftBoxPricing({
    template: {
      id: box.id,
      sizeName: box.sizeName,
      basePriceCents: box.boxChargeCents,
      capacityUnits: 99,
      minItems: 0,
      maxItems: 99,
      active: true,
    },
    selections,
    variants,
    packaging,
  });

  const configuration = await db.giftBoxConfiguration.create({
    data: {
      giftBoxId: box.id,
      sizeName: box.sizeName,
      capacityUnits: 99,
      giftMessage: input.giftMessage || null,
      occasion: input.occasion ?? null,
      packagingOptionId: packaging?.active ? packaging.id : null,
      itemsTotalCents: pricing.itemsTotalCents,
      boxChargeCents: pricing.boxChargeCents,
      packagingCents: pricing.packagingCents,
      totalCents: pricing.totalCents,
      status: "IN_CART",
      expiresAt: new Date(
        Date.now() + CONFIGURATION_TTL_DAYS * 24 * 60 * 60_000,
      ),
      items: {
        create: pricing.lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
          capacityUnits: line.capacityUnits,
          unitPriceCents: line.unitPriceCents,
        })),
      },
    },
  });

  return {
    configurationId: configuration.id,
    giftBoxId: box.id,
    name: box.name,
    sizeName: box.sizeName,
    packagingName: packaging?.name || null,
    giftMessage: input.giftMessage || null,
    occasion: input.occasion ?? null,
    totalCents: pricing.totalCents,
    quantity: 1,
    items: pricing.lines.map((line) => ({
      name: line.name,
      weightGrams: line.weightGrams,
      quantity: line.quantity,
    })),
  };
}

/**
 * Re-validate and re-price stored configurations for checkout. Prices are
 * always recalculated from current variant prices — never trusted from the
 * stored totals or the browser. Stored totals are refreshed when they drift.
 */
export async function loadGiftBoxCheckoutLines(
  locale: AppLocale,
  requests: Array<{ configurationId: string; quantity: number }>,
): Promise<GiftBoxCheckoutLine[]> {
  if (requests.length === 0) return [];
  if (!env.DATABASE_URL)
    throw new CommerceError(
      "DATABASE_NOT_CONFIGURED",
      "Gift box checkout requires a database.",
    );
  const configurations = await db.giftBoxConfiguration.findMany({
    where: {
      id: { in: requests.map((request) => request.configurationId) },
      status: "IN_CART",
    },
    include: {
      giftBox: true,
      packagingOption: true,
      items: true,
    },
  });
  if (configurations.length !== requests.length)
    throw new CommerceError(
      "GIFT_BOX_UNAVAILABLE",
      "A gift box configuration is no longer available.",
    );

  const lines: GiftBoxCheckoutLine[] = [];
  for (const request of requests) {
    const configuration = configurations.find(
      (entry) => entry.id === request.configurationId,
    )!;
    const selections = configuration.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity * request.quantity,
    }));
    const variants = await dbVariantsByIds(
      locale,
      selections.map((item) => item.variantId),
    );
    // Stock check across the full checkout quantity of this box.
    for (const selection of selections) {
      const variant = variants.find(
        (entry) => entry.variantId === selection.variantId,
      );
      if (!variant || !variant.eligible)
        throw new CommerceError(
          "GIFT_BOX_UNAVAILABLE",
          "A gift box product is no longer available.",
        );
      if (selection.quantity > variant.available)
        throw new CommerceError(
          "INSUFFICIENT_STOCK",
          `${variant.name} does not have enough available stock.`,
        );
    }
    const packaging = configuration.packagingOption
      ? {
          id: configuration.packagingOption.id,
          priceCents: configuration.packagingOption.priceCents,
          active: configuration.packagingOption.active,
        }
      : null;
    if (packaging && !packaging.active)
      throw new CommerceError(
        "GIFT_BOX_UNAVAILABLE",
        "The selected packaging is no longer available.",
      );
    const pricing = calculateGiftBoxPricing({
      template: {
        id: configuration.giftBoxId,
        sizeName: configuration.sizeName,
        basePriceCents: configuration.boxChargeCents,
        capacityUnits: configuration.capacityUnits,
        minItems: 0,
        maxItems: 99,
        active: true,
      },
      selections: configuration.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      variants,
      packaging,
    });
    if (pricing.totalCents !== configuration.totalCents)
      await db.giftBoxConfiguration.update({
        where: { id: configuration.id },
        data: {
          itemsTotalCents: pricing.itemsTotalCents,
          packagingCents: pricing.packagingCents,
          totalCents: pricing.totalCents,
          items: {
            updateMany: pricing.lines.map((line) => ({
              where: { variantId: line.variantId },
              data: { unitPriceCents: line.unitPriceCents },
            })),
          },
        },
      });

    const de = locale === "de";
    lines.push({
      configurationId: configuration.id,
      quantity: request.quantity,
      name: de ? configuration.giftBox.nameDe : configuration.giftBox.nameEn,
      sizeName: configuration.sizeName,
      packagingName: configuration.packagingOption
        ? de
          ? configuration.packagingOption.nameDe
          : configuration.packagingOption.nameEn
        : null,
      giftMessage: configuration.giftMessage,
      occasion: configuration.occasion,
      unitPriceCents: pricing.totalCents,
      taxCents: pricing.taxCents,
      weightGrams: pricing.weightGrams,
      snapshot: {
        giftBoxId: configuration.giftBoxId,
        boxChargeCents: pricing.boxChargeCents,
        packagingCents: pricing.packagingCents,
        itemsTotalCents: pricing.itemsTotalCents,
        items: pricing.lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          name: line.name,
          weightGrams: line.weightGrams,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
        })),
      },
      stockLines: selections,
    });
  }
  return lines;
}

/** Mark configurations as ordered once their order has been created. */
export async function markConfigurationsOrdered(configurationIds: string[]) {
  if (configurationIds.length === 0) return;
  await db.giftBoxConfiguration.updateMany({
    where: { id: { in: configurationIds } },
    data: { status: "ORDERED" },
  });
}
