import { describe, expect, it } from "vitest";
import de from "../../../messages/de.json";
import en from "../../../messages/en.json";
import {
  isCompleteProductTranslation,
  localiseCheckoutError,
  placeholderCopy,
  resolveLocaleRecord,
  statusLabels,
} from "./content";

describe("locale content policy", () => {
  it("resolves only the requested product translation", () => {
    const records = [
      { locale: "de" as const, name: "Feigen" },
      { locale: "en" as const, name: "Figs" },
    ];
    expect(resolveLocaleRecord(records, "en")?.name).toBe("Figs");
    expect(resolveLocaleRecord(records.slice(0, 1), "en")).toBeNull();
  });

  it("blocks missing and placeholder product translations", () => {
    const complete = {
      name: "Figs",
      slug: "figs",
      shortDescription: "Selected dried figs.",
      description: "Selected dried figs from Kandahar.",
      ingredients: "Figs",
      allergenStatement: "See packaging.",
      storageInstructions: "Store in a cool, dry place.",
      seoTitle: "Figs",
      metaDescription: "Selected figs from Khan Dry Fruit.",
    };
    expect(isCompleteProductTranslation(complete)).toBe(true);
    expect(
      isCompleteProductTranslation({
        ...complete,
        ingredients: placeholderCopy.en.ingredients,
      }),
    ).toBe(false);
    expect(isCompleteProductTranslation(null)).toBe(false);
  });

  it("localises statuses and publication placeholders", () => {
    expect(statusLabels.de.DRAFT).toBe("Produktentwurf");
    expect(statusLabels.en.DRAFT).toBe("Draft product");
    expect(placeholderCopy.en.allergens).not.toMatch(/Allergeninformationen/);
    expect(placeholderCopy.de.allergens).not.toMatch(/required/i);
  });

  it("localises validation errors by stable code", () => {
    expect(localiseCheckoutError("de", "VALIDATION_ERROR")).toMatch(/Bitte/);
    expect(localiseCheckoutError("en", "VALIDATION_ERROR")).toMatch(/Please/);
  });

  it("keeps metadata and 404 copy language-specific", () => {
    expect(en.errors.notFoundTitle).toBe("Page not found");
    expect(de.errors.notFoundTitle).toBe("Seite nicht gefunden");
    expect(en.home.title).not.toMatch(/Trockenfrüchte/);
    expect(de.home.title).not.toMatch(/Dry Fruits/);
  });
});
