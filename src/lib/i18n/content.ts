import type { AppLocale } from "@/config/site";

export const placeholderCopy = {
  de: {
    productInformation:
      "Produktinformationen müssen vor der Veröffentlichung bestätigt werden.",
    ingredients: "Zutaten müssen vor der Veröffentlichung bestätigt werden.",
    allergens:
      "Allergeninformationen sind vor der Veröffentlichung erforderlich.",
    nutrition: "Nährwertangaben sind vor der Veröffentlichung erforderlich.",
    storage: "Lagerhinweise sind vor der Veröffentlichung erforderlich.",
    business: "Unternehmensangaben sind vor dem Start erforderlich.",
    legal: "Rechtstext ist vor dem Start erforderlich.",
    contentIncomplete: "Inhalt unvollständig",
  },
  en: {
    productInformation:
      "Product information must be confirmed before publication.",
    ingredients: "Ingredients must be confirmed before publication.",
    allergens: "Allergen information is required before publication.",
    nutrition: "Nutrition information is required before publication.",
    storage: "Storage information is required before publication.",
    business: "Business information is required before launch.",
    legal: "Legal text is required before launch.",
    contentIncomplete: "Content incomplete",
  },
} as const;

export const statusLabels = {
  de: {
    DRAFT: "Produktentwurf",
    ACTIVE: "Aktiv",
    ARCHIVED: "Archiviert",
  },
  en: { DRAFT: "Draft product", ACTIVE: "Active", ARCHIVED: "Archived" },
} as const;

const checkoutErrors: Record<AppLocale, Record<string, string>> = {
  de: {
    DATABASE_NOT_CONFIGURED:
      "Die Kasse ist in dieser Entwicklungsumgebung nicht verfügbar.",
    VALIDATION_ERROR: "Bitte prüfen Sie die Angaben zur Bestellung.",
    PRODUCT_NOT_PUBLISHED:
      "Ein Produkt ist noch nicht für den Verkauf freigegeben.",
    STOCK_CHANGED:
      "Die Verfügbarkeit hat sich geändert. Bitte prüfen Sie Ihren Warenkorb.",
    CHECKOUT_FAILED:
      "Die Kasse konnte nicht gestartet werden. Bitte versuchen Sie es erneut.",
  },
  en: {
    DATABASE_NOT_CONFIGURED:
      "Checkout is not available in this development environment.",
    VALIDATION_ERROR: "Please review the checkout details.",
    PRODUCT_NOT_PUBLISHED: "A product is not approved for sale yet.",
    STOCK_CHANGED: "Stock availability changed. Please review your cart.",
    CHECKOUT_FAILED: "Checkout could not be created. Please try again.",
  },
};

export function localiseCheckoutError(locale: AppLocale, code?: string) {
  return (
    checkoutErrors[locale][code ?? ""] ?? checkoutErrors[locale].CHECKOUT_FAILED
  );
}

export function resolveLocaleRecord<T extends { locale: AppLocale }>(
  records: readonly T[],
  locale: AppLocale,
) {
  return records.find((record) => record.locale === locale) ?? null;
}

export function isPlaceholder(value?: string | null) {
  if (!value?.trim()) return true;
  const normalized = value.trim();
  return (
    normalized.startsWith("[") ||
    /required before|vor (?:der veröffentlichung|dem start)|must be confirmed/i.test(
      normalized,
    )
  );
}

export function isCompleteProductTranslation(
  translation?: {
    name?: string | null;
    slug?: string | null;
    shortDescription?: string | null;
    description?: string | null;
    ingredients?: string | null;
    allergenStatement?: string | null;
    storageInstructions?: string | null;
    seoTitle?: string | null;
    metaDescription?: string | null;
  } | null,
) {
  if (!translation) return false;
  return [
    translation.name,
    translation.slug,
    translation.shortDescription,
    translation.description,
    translation.ingredients,
    translation.allergenStatement,
    translation.storageInstructions,
    translation.seoTitle,
    translation.metaDescription,
  ].every((value) => !isPlaceholder(value));
}
