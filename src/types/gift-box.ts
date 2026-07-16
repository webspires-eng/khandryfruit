import type { AppLocale } from "@/config/site";

export type GiftBoxContentLine = {
  productId: string;
  variantId: string;
  productName: string;
  weightGrams: number;
  quantity: number;
};

export type GiftBoxCatalogueItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  seoTitle: string;
  metaDescription: string;
  imageUrl: string | null;
  sizeName: string;
  occasions: string[];
  fixed: boolean;
  status: "ACTIVE" | "DRAFT";
  /** Charge for the box itself (packing, card, box material). */
  boxChargeCents: number;
  /** Full price: box charge + current contents prices. */
  priceCents: number;
  available: boolean;
  items: GiftBoxContentLine[];
  alternateSlugs: Partial<Record<AppLocale, string>>;
};

export type GiftBoxBuilderTemplate = {
  id: string;
  name: string;
  sizeName: string;
  capacityUnits: number;
  minItems: number;
  maxItems: number;
  boxChargeCents: number;
  active: boolean;
};

export type GiftBoxPackagingChoice = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  active: boolean;
};

export type GiftBoxBuilderVariant = {
  variantId: string;
  weightGrams: number;
  priceCents: number;
  available: number;
  /** Slots one pack occupies inside a box. */
  capacityUnits: number;
};

export type GiftBoxBuilderProduct = {
  productId: string;
  name: string;
  category: string;
  image: string;
  imageAlt: string;
  status: "ACTIVE" | "DRAFT";
  variants: GiftBoxBuilderVariant[];
};

/** Client cart line for a configured gift box (standard items stay untouched). */
export type GiftBoxCartLine = {
  configurationId: string;
  giftBoxId: string;
  name: string;
  sizeName: string;
  packagingName: string | null;
  giftMessage: string | null;
  occasion: string | null;
  totalCents: number;
  quantity: number;
  items: Array<{ name: string; weightGrams: number; quantity: number }>;
};
