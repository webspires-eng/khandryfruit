import { describe, expect, it } from "vitest";
import { z } from "zod";

import { localizeFieldErrors, translate } from "./translate";

describe("translate", () => {
  it("resolves nested keys per locale", () => {
    expect(translate("de", "wholesaleForm.companyName")).toBe("Firmenname");
    expect(translate("en", "wholesaleForm.companyName")).toBe("Company name");
  });

  it("interpolates variables", () => {
    expect(
      translate("en", "wholesaleStatus.appliedOn", { date: "1 July 2026" }),
    ).toContain("1 July 2026");
  });

  it("falls back to the key for unknown paths", () => {
    expect(translate("de", "does.not.exist")).toBe("does.not.exist");
  });
});

describe("localizeFieldErrors", () => {
  const schema = z.object({
    email: z.string().email("validation.email"),
    consent: z.literal(true, "validation.consent"),
  });

  it("maps issue message keys to localized field messages", () => {
    const result = schema.safeParse({ email: "nope", consent: false });
    expect(result.success).toBe(false);
    if (result.success) return;
    const german = localizeFieldErrors(result.error, "de");
    expect(german.email?.[0]).toBe(
      "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    );
    expect(german.consent?.[0]).toContain("Datenschutzerklärung");
    const english = localizeFieldErrors(result.error, "en");
    expect(english.email?.[0]).toBe("Please enter a valid email address.");
  });

  it("falls back to the generic required message for unknown issue texts", () => {
    const fallbackSchema = z.object({ name: z.string().min(2) });
    const result = fallbackSchema.safeParse({ name: "" });
    if (result.success) throw new Error("expected failure");
    const errors = localizeFieldErrors(result.error, "en");
    expect(errors.name?.[0]).toBe("Please fill in this field.");
  });
});
