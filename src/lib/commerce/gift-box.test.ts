import { describe, expect, it } from "vitest";

import {
  calculateGiftBoxPricing,
  GiftBoxValidationError,
  validateGiftBoxSelection,
  type GiftBoxEligibleVariant,
  type GiftBoxTemplate,
} from "./gift-box";

const template: GiftBoxTemplate = {
  id: "box-medium",
  sizeName: "MEDIUM",
  basePriceCents: 599,
  capacityUnits: 5,
  minItems: 3,
  maxItems: 5,
  active: true,
};

function variant(
  overrides: Partial<GiftBoxEligibleVariant> = {},
): GiftBoxEligibleVariant {
  return {
    variantId: "v1",
    productId: "p1",
    name: "Schwarze Rosinen",
    weightGrams: 500,
    priceCents: 899,
    vatRateBps: 700,
    available: 10,
    capacityUnits: 1,
    eligible: true,
    ...overrides,
  };
}

function code(run: () => void): string | null {
  try {
    run();
    return null;
  } catch (error) {
    if (error instanceof GiftBoxValidationError) return error.code;
    throw error;
  }
}

describe("gift box capacity rules", () => {
  it("accepts a valid selection", () => {
    expect(
      code(() =>
        validateGiftBoxSelection({
          template,
          selections: [{ variantId: "v1", quantity: 3 }],
          variants: [variant()],
        }),
      ),
    ).toBeNull();
  });

  it("rejects selections below the minimum", () => {
    expect(
      code(() =>
        validateGiftBoxSelection({
          template,
          selections: [{ variantId: "v1", quantity: 2 }],
          variants: [variant()],
        }),
      ),
    ).toBe("MIN_ITEMS");
  });

  it("rejects selections above the maximum", () => {
    expect(
      code(() =>
        validateGiftBoxSelection({
          template,
          selections: [{ variantId: "v1", quantity: 6 }],
          variants: [variant()],
        }),
      ),
    ).toBe("MAX_ITEMS");
  });

  it("rejects selections that exceed the box capacity", () => {
    // 3 one-kilogram packs occupy 6 slots in a 5-slot box even though the
    // item count satisfies min/max.
    expect(
      code(() =>
        validateGiftBoxSelection({
          template,
          selections: [{ variantId: "v1", quantity: 3 }],
          variants: [variant({ weightGrams: 1000, capacityUnits: 2 })],
        }),
      ),
    ).toBe("CAPACITY_EXCEEDED");
  });

  it("rejects ineligible and unknown products", () => {
    expect(
      code(() =>
        validateGiftBoxSelection({
          template,
          selections: [{ variantId: "missing", quantity: 3 }],
          variants: [variant()],
        }),
      ),
    ).toBe("PRODUCT_INELIGIBLE");
    expect(
      code(() =>
        validateGiftBoxSelection({
          template,
          selections: [{ variantId: "v1", quantity: 3 }],
          variants: [variant({ eligible: false })],
        }),
      ),
    ).toBe("PRODUCT_INELIGIBLE");
  });

  it("rejects selections beyond live stock", () => {
    expect(
      code(() =>
        validateGiftBoxSelection({
          template,
          selections: [{ variantId: "v1", quantity: 4 }],
          variants: [variant({ available: 3 })],
        }),
      ),
    ).toBe("INSUFFICIENT_STOCK");
  });

  it("rejects over-long gift messages and inactive packaging", () => {
    expect(
      code(() =>
        validateGiftBoxSelection({
          template,
          selections: [{ variantId: "v1", quantity: 3 }],
          variants: [variant()],
          giftMessage: "x".repeat(241),
        }),
      ),
    ).toBe("MESSAGE_TOO_LONG");
    expect(
      code(() =>
        validateGiftBoxSelection({
          template,
          selections: [{ variantId: "v1", quantity: 3 }],
          variants: [variant()],
          packaging: { id: "pack", priceCents: 490, active: false },
        }),
      ),
    ).toBe("PACKAGING_UNAVAILABLE");
  });

  it("rejects inactive templates", () => {
    expect(
      code(() =>
        validateGiftBoxSelection({
          template: { ...template, active: false },
          selections: [{ variantId: "v1", quantity: 3 }],
          variants: [variant()],
        }),
      ),
    ).toBe("TEMPLATE_UNAVAILABLE");
  });
});

describe("gift box pricing", () => {
  it("prices items, box charge and packaging from server data only", () => {
    const pricing = calculateGiftBoxPricing({
      template,
      selections: [
        { variantId: "v1", quantity: 2 },
        { variantId: "v2", quantity: 1 },
      ],
      variants: [
        variant(),
        variant({ variantId: "v2", productId: "p2", priceCents: 1299 }),
      ],
      packaging: { id: "pack", priceCents: 490, active: true },
    });
    expect(pricing.itemsTotalCents).toBe(2 * 899 + 1299);
    expect(pricing.boxChargeCents).toBe(599);
    expect(pricing.packagingCents).toBe(490);
    expect(pricing.totalCents).toBe(2 * 899 + 1299 + 599 + 490);
    expect(pricing.weightGrams).toBe(3 * 500);
    expect(pricing.lines).toHaveLength(2);
    expect(pricing.taxCents).toBeGreaterThan(0);
  });

  it("treats missing packaging as free", () => {
    const pricing = calculateGiftBoxPricing({
      template,
      selections: [{ variantId: "v1", quantity: 3 }],
      variants: [variant()],
      packaging: null,
    });
    expect(pricing.packagingCents).toBe(0);
    expect(pricing.totalCents).toBe(3 * 899 + 599);
  });
});
