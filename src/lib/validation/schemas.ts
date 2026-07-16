import { z } from "zod";

export const localeSchema = z.enum(["de", "en"]);
export const cartLineSchema = z.object({
  variantId: z.string().min(1).max(128),
  quantity: z.number().int().min(1).max(20),
});
export const checkoutGiftBoxSchema = z.object({
  configurationId: z.string().min(1).max(128),
  quantity: z.number().int().min(1).max(5),
});
export const checkoutSchema = z
  .object({
    locale: localeSchema,
    email: z.string().email(),
    countryCode: z.literal("DE"),
    shippingMethodId: z.string().min(1),
    couponCode: z.string().trim().toUpperCase().max(32).optional(),
    legalAccepted: z.literal(true),
    lines: z.array(cartLineSchema).max(50).default([]),
    giftBoxes: z.array(checkoutGiftBoxSchema).max(10).default([]),
  })
  .refine((data) => data.lines.length + data.giftBoxes.length > 0, {
    message: "EMPTY_CART",
    path: ["lines"],
  });

export const enquiryTypeValues = [
  "GENERAL",
  "ORDER",
  "PRODUCT",
  "DELIVERY",
  "WHOLESALE",
  "GIFT_BOXES",
  "RETURNS",
  "OTHER",
] as const;
export const contactMethodValues = ["EMAIL", "PHONE", "WHATSAPP"] as const;

export const contactSchema = z.object({
  locale: localeSchema,
  name: z.string().trim().min(2, "validation.tooShort").max(100, "validation.tooLong"),
  email: z.string().email("validation.email"),
  phone: z.string().trim().max(30, "validation.tooLong").optional(),
  orderNumber: z.string().trim().max(30, "validation.orderNumber").optional(),
  type: z.enum(enquiryTypeValues, "validation.selectOption"),
  subject: z.string().trim().min(3, "validation.tooShort").max(150, "validation.tooLong"),
  message: z
    .string()
    .trim()
    .min(10, "validation.messageLength")
    .max(2_000, "validation.messageLength"),
  preferredContactMethod: z.enum(contactMethodValues, "validation.selectOption"),
  consent: z.literal(true, "validation.consent"),
  // Honeypot: invisible to humans, bots tend to fill it.
  website: z.string().max(0).optional(),
});

export const businessTypeValues = [
  "GROCERY_RETAILER",
  "RESTAURANT",
  "CAFE",
  "BAKERY",
  "CONFECTIONER",
  "DISTRIBUTOR",
  "CORPORATE_BUYER",
  "MARKET_TRADER",
  "OTHER",
] as const;

export const wholesaleApplicationSchema = z
  .object({
    locale: localeSchema,
    companyName: z
      .string()
      .trim()
      .min(2, "validation.tooShort")
      .max(160, "validation.tooLong"),
    contactName: z
      .string()
      .trim()
      .min(2, "validation.tooShort")
      .max(120, "validation.tooLong"),
    email: z.string().email("validation.email"),
    phone: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, "validation.phone"),
    businessAddress: z
      .string()
      .trim()
      .min(10, "validation.tooShort")
      .max(300, "validation.tooLong"),
    city: z.string().trim().min(2, "validation.tooShort").max(80, "validation.tooLong"),
    postalCode: z
      .string()
      .trim()
      .min(3, "validation.tooShort")
      .max(12, "validation.tooLong"),
    countryCode: z.string().trim().length(2, "validation.country").toUpperCase(),
    vatId: z.string().trim().max(30, "validation.tooLong").optional(),
    registrationNumber: z.string().trim().max(60, "validation.tooLong").optional(),
    businessType: z.enum(businessTypeValues, "validation.selectOption"),
    website: z.string().url("validation.url").optional().or(z.literal("")),
    monthlyOrderVolume: z
      .string()
      .trim()
      .min(1, "validation.selectOption")
      .max(80, "validation.tooLong"),
    productsOfInterest: z.array(z.string().max(160)).min(1, "validation.selectAtLeastOne"),
    deliveryCountries: z
      .array(z.string().trim().min(2).max(24))
      .min(1, "validation.selectAtLeastOne"),
    preferredContactMethod: z.enum(contactMethodValues, "validation.selectOption"),
    message: z.string().trim().max(2_000, "validation.tooLong").optional(),
    agreement: z.literal(true, "validation.consent"),
    accuracyConfirmed: z.literal(true, "validation.accuracy"),
    // Honeypot: invisible to humans, bots tend to fill it.
    faxNumber: z.string().max(0).optional(),
  })
  .refine((data) => Boolean(data.vatId?.trim() || data.registrationNumber?.trim()), {
    message: "validation.required",
    path: ["vatId"],
  });

export const giftOccasionValues = [
  "RAMADAN",
  "EID",
  "CHRISTMAS",
  "NOWRUZ",
  "WEDDING",
  "CORPORATE",
  "THANK_YOU",
  "GENERAL",
] as const;

export const giftBoxConfigurationSchema = z.object({
  locale: localeSchema,
  giftBoxId: z.string().min(1).max(128),
  packagingOptionId: z.string().min(1).max(128).optional(),
  occasion: z.enum(giftOccasionValues, "validation.selectOption").optional(),
  giftMessage: z.string().trim().max(240).optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1).max(128),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(24),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type WholesaleApplicationInput = z.infer<typeof wholesaleApplicationSchema>;
export type GiftBoxConfigurationInput = z.infer<typeof giftBoxConfigurationSchema>;

export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };
