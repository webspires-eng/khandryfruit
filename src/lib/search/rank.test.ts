import { describe, expect, it } from "vitest";

import { paginate, rankProducts, type SearchableProduct } from "./rank";

function product(overrides: Partial<SearchableProduct> = {}): SearchableProduct {
  return {
    id: "p1",
    slug: "schwarze-rosinen",
    name: "Schwarze Rosinen",
    shortDescription: "Dunkle Rosinen aus Kabul.",
    description: "Rosinen mit weicher Textur.",
    ingredients: "",
    allergenStatement: "",
    storageInstructions: "",
    originCountry: "Afghanistan",
    originRegion: "Kabul",
    image: "",
    imageAlt: "",
    category: "Rosinen",
    categorySlug: "rosinen",
    featured: false,
    bestseller: false,
    status: "ACTIVE",
    variants: [],
    ...overrides,
  };
}

describe("search ranking", () => {
  it("matches German names for German queries and ranks name hits first", () => {
    const products = [
      product(),
      product({
        id: "p2",
        name: "Afghanische Feigen",
        category: "Feigen",
        originRegion: "Kandahar",
        shortDescription: "Feigen aus Kandahar, auch mit Rosinen kombinierbar.",
        description: "",
      }),
    ];
    const { results } = rankProducts(products, "Rosinen");
    expect(results.length).toBe(2);
    expect(results[0].product.id).toBe("p1");
  });

  it("matches English names for English queries", () => {
    const products = [
      product({ id: "en1", name: "Black Raisins", category: "Raisins" }),
      product({ id: "en2", name: "Dried Figs", category: "Figs" }),
    ];
    const { results } = rankProducts(products, "raisins");
    expect(results.map((entry) => entry.product.id)).toContain("en1");
    expect(results[0].product.id).toBe("en1");
  });

  it("folds umlauts so 'gruene' matches 'Grüne'", () => {
    const { results } = rankProducts(
      [product({ id: "p3", name: "Grüne Rosinen" })],
      "gruene rosinen",
    );
    expect(results).toHaveLength(1);
  });

  it("matches origin regions and curated aliases", () => {
    const products = [
      product({ id: "kabul", originRegion: "Kabul" }),
      product({
        id: "alias",
        name: "Schwarze Rosinen",
        searchAliases: ["Kishmish"],
      }),
    ];
    expect(
      rankProducts(products, "Kabul").results.some(
        (entry) => entry.product.id === "kabul",
      ),
    ).toBe(true);
    expect(
      rankProducts(products, "kishmish").results.some(
        (entry) => entry.product.id === "alias",
      ),
    ).toBe(true);
  });

  it("excludes draft products unless drafts are explicitly included", () => {
    const products = [product({ id: "draft", status: "DRAFT" })];
    expect(rankProducts(products, "Rosinen").results).toHaveLength(0);
    expect(
      rankProducts(products, "Rosinen", { includeDrafts: true }).results,
    ).toHaveLength(1);
  });

  it("offers a suggestion for close misspellings", () => {
    const { results, suggestion } = rankProducts(
      [product()],
      "Rosinnen aus irgendwo",
    );
    expect(results).toHaveLength(1);
    expect(suggestion).toBe("Schwarze Rosinen");
  });

  it("returns nothing for an empty query", () => {
    expect(rankProducts([product()], "  ").results).toHaveLength(0);
  });
});

describe("search pagination", () => {
  const items = Array.from({ length: 30 }, (_, index) => index);

  it("slices pages and reports totals", () => {
    const page = paginate(items, 2, 12);
    expect(page.items[0]).toBe(12);
    expect(page.items).toHaveLength(12);
    expect(page.total).toBe(30);
    expect(page.totalPages).toBe(3);
  });

  it("clamps out-of-range pages", () => {
    expect(paginate(items, 99, 12).page).toBe(3);
    expect(paginate(items, 0, 12).page).toBe(1);
    expect(paginate([], 1, 12).totalPages).toBe(1);
  });
});
