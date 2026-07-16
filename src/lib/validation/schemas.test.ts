import { describe, expect, it } from "vitest";

import { contactSchema, wholesaleApplicationSchema } from "./schemas";

const validWholesale = {
  locale: "de",
  companyName: "Feinkost Beispiel GmbH",
  contactName: "Alex Beispiel",
  email: "einkauf@example.com",
  phone: "+4917612345678",
  businessAddress: "Musterstraße 12",
  city: "Duisburg",
  postalCode: "47051",
  countryCode: "de",
  vatId: "DE123456789",
  registrationNumber: "",
  businessType: "GROCERY_RETAILER",
  website: "https://example.com",
  monthlyOrderVolume: "FROM_500_TO_1500",
  productsOfInterest: ["Rosinen"],
  deliveryCountries: ["DE"],
  preferredContactMethod: "EMAIL",
  message: "Wir interessieren uns für Rosinen in 5-kg-Gebinden.",
  agreement: true,
  accuracyConfirmed: true,
  faxNumber: "",
};

describe("wholesale application validation", () => {
  it("accepts a complete application and normalises the country code", () => {
    const parsed = wholesaleApplicationSchema.parse(validWholesale);
    expect(parsed.countryCode).toBe("DE");
    expect(parsed.businessType).toBe("GROCERY_RETAILER");
  });

  it("rejects the submission when the honeypot is filled", () => {
    expect(() =>
      wholesaleApplicationSchema.parse({
        ...validWholesale,
        faxNumber: "http://spam.example",
      }),
    ).toThrow();
  });

  it("requires privacy agreement and accuracy confirmation", () => {
    expect(() =>
      wholesaleApplicationSchema.parse({ ...validWholesale, agreement: false }),
    ).toThrow();
    expect(() =>
      wholesaleApplicationSchema.parse({
        ...validWholesale,
        accuracyConfirmed: false,
      }),
    ).toThrow();
  });

  it("requires an international phone number", () => {
    expect(() =>
      wholesaleApplicationSchema.parse({ ...validWholesale, phone: "0176123" }),
    ).toThrow();
  });

  it("requires at least a VAT ID or a registration number", () => {
    const result = wholesaleApplicationSchema.safeParse({
      ...validWholesale,
      vatId: "",
      registrationNumber: "",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.some((issue) => issue.path[0] === "vatId")).toBe(
        true,
      );
  });

  it("rejects unknown business types", () => {
    expect(() =>
      wholesaleApplicationSchema.parse({
        ...validWholesale,
        businessType: "SPACE_AGENCY",
      }),
    ).toThrow();
  });
});

const validContact = {
  locale: "en",
  name: "Sam Sample",
  email: "sam@example.com",
  phone: "+4917612345678",
  orderNumber: "KDF-2026-AB12",
  type: "ORDER",
  subject: "Delivery date",
  message: "Could you tell me when my order will arrive?",
  preferredContactMethod: "EMAIL",
  consent: true,
  website: "",
};

describe("contact enquiry validation", () => {
  it("accepts a complete enquiry", () => {
    const parsed = contactSchema.parse(validContact);
    expect(parsed.type).toBe("ORDER");
  });

  it("rejects submissions with a filled honeypot (spam protection)", () => {
    expect(() =>
      contactSchema.parse({ ...validContact, website: "https://spam.example" }),
    ).toThrow();
  });

  it("requires consent and a sufficiently long message", () => {
    expect(() =>
      contactSchema.parse({ ...validContact, consent: false }),
    ).toThrow();
    expect(() =>
      contactSchema.parse({ ...validContact, message: "short" }),
    ).toThrow();
  });

  it("supports every configured enquiry type", () => {
    for (const type of [
      "GENERAL",
      "ORDER",
      "PRODUCT",
      "DELIVERY",
      "WHOLESALE",
      "GIFT_BOXES",
      "RETURNS",
      "OTHER",
    ])
      expect(contactSchema.parse({ ...validContact, type }).type).toBe(type);
  });
});
