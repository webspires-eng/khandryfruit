import { includedTax } from "./money";

export const GIFT_MESSAGE_MAX_LENGTH = 240;
/** VAT applied to box and packaging charges (non-food service share). */
export const PACKAGING_VAT_RATE_BPS = 1900;

export type GiftBoxTemplate = {
  id: string;
  sizeName: string;
  basePriceCents: number;
  capacityUnits: number;
  minItems: number;
  maxItems: number;
  active: boolean;
};

export type GiftBoxEligibleVariant = {
  variantId: string;
  productId: string;
  name: string;
  weightGrams: number;
  priceCents: number;
  vatRateBps: number;
  available: number;
  /** Slots one pack occupies inside the box. */
  capacityUnits: number;
  eligible: boolean;
};

export type GiftBoxSelection = {
  variantId: string;
  quantity: number;
};

export type GiftBoxPackagingOption = {
  id: string;
  priceCents: number;
  active: boolean;
};

export type GiftBoxPricedLine = {
  variantId: string;
  productId: string;
  name: string;
  weightGrams: number;
  quantity: number;
  capacityUnits: number;
  unitPriceCents: number;
  lineTotalCents: number;
  taxCents: number;
};

export type GiftBoxPricing = {
  lines: GiftBoxPricedLine[];
  itemsTotalCents: number;
  boxChargeCents: number;
  packagingCents: number;
  totalCents: number;
  taxCents: number;
  weightGrams: number;
};

export class GiftBoxValidationError extends Error {
  constructor(
    public readonly code:
      | "TEMPLATE_UNAVAILABLE"
      | "MIN_ITEMS"
      | "MAX_ITEMS"
      | "CAPACITY_EXCEEDED"
      | "PRODUCT_INELIGIBLE"
      | "INSUFFICIENT_STOCK"
      | "MESSAGE_TOO_LONG"
      | "PACKAGING_UNAVAILABLE",
    public readonly meta: Record<string, string | number> = {},
  ) {
    super(code);
    this.name = "GiftBoxValidationError";
  }
}

/**
 * Validate a build-your-own selection against the box template, product
 * eligibility, capacity and live stock. Throws a coded error for the first
 * violated rule so callers can render a localized message.
 */
export function validateGiftBoxSelection(input: {
  template: GiftBoxTemplate;
  selections: GiftBoxSelection[];
  variants: GiftBoxEligibleVariant[];
  packaging?: GiftBoxPackagingOption | null;
  giftMessage?: string | null;
}): void {
  const { template, selections, variants, packaging, giftMessage } = input;
  if (!template.active)
    throw new GiftBoxValidationError("TEMPLATE_UNAVAILABLE");

  const byVariant = new Map(variants.map((v) => [v.variantId, v]));
  let totalQuantity = 0;
  let usedCapacity = 0;
  for (const selection of selections) {
    const variant = byVariant.get(selection.variantId);
    if (!variant || !variant.eligible)
      throw new GiftBoxValidationError("PRODUCT_INELIGIBLE", {
        variantId: selection.variantId,
      });
    if (selection.quantity > variant.available)
      throw new GiftBoxValidationError("INSUFFICIENT_STOCK", {
        name: variant.name,
        available: variant.available,
      });
    totalQuantity += selection.quantity;
    usedCapacity += selection.quantity * variant.capacityUnits;
  }

  if (totalQuantity < template.minItems)
    throw new GiftBoxValidationError("MIN_ITEMS", { min: template.minItems });
  if (totalQuantity > template.maxItems)
    throw new GiftBoxValidationError("MAX_ITEMS", { max: template.maxItems });
  if (usedCapacity > template.capacityUnits)
    throw new GiftBoxValidationError("CAPACITY_EXCEEDED", {
      capacity: template.capacityUnits,
      used: usedCapacity,
    });

  if (giftMessage && giftMessage.length > GIFT_MESSAGE_MAX_LENGTH)
    throw new GiftBoxValidationError("MESSAGE_TOO_LONG", {
      max: GIFT_MESSAGE_MAX_LENGTH,
    });

  if (packaging !== undefined && packaging !== null && !packaging.active)
    throw new GiftBoxValidationError("PACKAGING_UNAVAILABLE");
}

/**
 * Price a gift box exclusively from server-controlled inputs (variant prices,
 * box charge, packaging charge). Client-submitted totals must never reach
 * this function.
 */
export function calculateGiftBoxPricing(input: {
  template: GiftBoxTemplate;
  selections: GiftBoxSelection[];
  variants: GiftBoxEligibleVariant[];
  packaging?: GiftBoxPackagingOption | null;
}): GiftBoxPricing {
  const byVariant = new Map(input.variants.map((v) => [v.variantId, v]));
  const lines: GiftBoxPricedLine[] = input.selections.map((selection) => {
    const variant = byVariant.get(selection.variantId);
    if (!variant)
      throw new GiftBoxValidationError("PRODUCT_INELIGIBLE", {
        variantId: selection.variantId,
      });
    const lineTotalCents = variant.priceCents * selection.quantity;
    return {
      variantId: variant.variantId,
      productId: variant.productId,
      name: variant.name,
      weightGrams: variant.weightGrams,
      quantity: selection.quantity,
      capacityUnits: variant.capacityUnits,
      unitPriceCents: variant.priceCents,
      lineTotalCents,
      taxCents: includedTax(lineTotalCents, variant.vatRateBps),
    };
  });

  const itemsTotalCents = lines.reduce(
    (sum, line) => sum + line.lineTotalCents,
    0,
  );
  const boxChargeCents = input.template.basePriceCents;
  const packagingCents = input.packaging?.priceCents ?? 0;
  const chargesTax = includedTax(
    boxChargeCents + packagingCents,
    PACKAGING_VAT_RATE_BPS,
  );
  return {
    lines,
    itemsTotalCents,
    boxChargeCents,
    packagingCents,
    totalCents: itemsTotalCents + boxChargeCents + packagingCents,
    taxCents: lines.reduce((sum, line) => sum + line.taxCents, 0) + chargesTax,
    weightGrams: lines.reduce(
      (sum, line) => sum + line.weightGrams * line.quantity,
      0,
    ),
  };
}

/** A single product inside a gift box, as recorded on the order. */
export type GiftBoxSnapshotItem = {
  name: string;
  quantity: number;
  weightGrams: number;
};

/**
 * Reads the contents recorded on an order's gift-box line.
 *
 * `OrderGiftBoxItem.snapshot` is `Json`, written at checkout so the order keeps
 * what was actually bought even if the box is later re-curated. It is parsed
 * defensively: a malformed or legacy snapshot yields an empty list rather than
 * breaking the order page.
 */
export function readGiftBoxContents(snapshot: unknown): GiftBoxSnapshotItem[] {
  if (typeof snapshot !== "object" || snapshot === null) return [];
  const items = (snapshot as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  return items.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const { name, quantity, weightGrams } = entry as Record<string, unknown>;
    if (typeof name !== "string" || !name) return [];
    return [
      {
        name,
        quantity: typeof quantity === "number" && quantity > 0 ? quantity : 1,
        weightGrams: typeof weightGrams === "number" ? weightGrams : 0,
      },
    ];
  });
}

/** "2× Black Raisins (500 g) · 1× Afghan Figs (500 g)" */
export function formatGiftBoxContents(items: GiftBoxSnapshotItem[]) {
  return items
    .map(
      (item) =>
        `${item.quantity}× ${item.name}${item.weightGrams ? ` (${item.weightGrams} g)` : ""}`,
    )
    .join(" · ");
}
