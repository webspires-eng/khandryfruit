import type { AppLocale } from "@/config/site";

export type CatalogueVariant = {
  id: string;
  sku: string;
  weightGrams: number;
  priceCents: number;
  vatRateBps: number;
  available: number;
  active: boolean;
};

export type CatalogueProduct = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  ingredients: string;
  allergenStatement: string;
  storageInstructions: string;
  originCountry: string;
  originRegion: string;
  responsibleFoodBusiness?: string;
  image: string;
  imageAlt: string;
  alternateSlugs?: Partial<Record<AppLocale, string>>;
  category: string;
  categorySlug: string;
  featured: boolean;
  bestseller: boolean;
  status: "DRAFT" | "ACTIVE";
  variants: CatalogueVariant[];
};

export type CartLineInput = { variantId: string; quantity: number };

export type CalculatedLine = {
  variantId: string;
  productId: string;
  name: string;
  sku: string;
  weightGrams: number;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  taxCents: number;
};

export type CartCalculation = {
  lines: CalculatedLine[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: "EUR";
};
