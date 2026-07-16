import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/config/site";
import { Link } from "@/i18n/navigation";

const pages: Record<
  string,
  {
    de: [string, string];
    en: [string, string];
    legal?: boolean;
    noindex?: boolean;
  }
> = {
  bestsellers: {
    de: [
      "Bestseller",
      "Unsere als Bestseller markierten Entwicklungsprodukte. Echte Verkaufsdaten ersetzen diese Auswahl nach dem Start.",
    ],
    en: [
      "Bestsellers",
      "Development products currently marked as bestsellers. Genuine sales data will replace this selection after launch.",
    ],
  },
  "our-story": {
    de: [
      "Unsere Geschichte",
      "Khan Dry Fruit präsentiert ausgewählte afghanische Trockenfrüchte in Duisburg. Die vollständige Unternehmensgeschichte wird nach Freigabe durch Shoaib Khan Safi veröffentlicht.",
    ],
    en: [
      "Our story",
      "Khan Dry Fruit presents selected Afghan dry fruits in Duisburg. The complete company story will be published after approval by Shoaib Khan Safi.",
    ],
  },
  sourcing: {
    de: [
      "Herkunft & Qualität",
      "Bestätigte Beispiele: Feigen aus Kandahar, Pfirsiche aus Logar, Rosinen aus Kabul und Maulbeeren aus Shamali. Weitere Aussagen benötigen einen Nachweis.",
    ],
    en: [
      "Sourcing & quality",
      "Confirmed examples: figs from Kandahar, peaches from Logar, raisins from Kabul and mulberries from Shamali. Further claims require evidence.",
    ],
  },
  recipes: {
    de: [
      "Rezepte & Verwendung",
      "Servierideen und Rezepte folgen nach fachlicher Inhaltsprüfung. Es werden keine medizinischen Wirkversprechen veröffentlicht.",
    ],
    en: [
      "Recipes & uses",
      "Serving ideas and recipes will follow editorial review. No medical outcome claims will be published.",
    ],
  },
  blog: {
    de: [
      "Magazin",
      "Herkunft, Lagerung, Sortenkunde und Geschenkideen – redaktionell vorbereitet und vor Veröffentlichung geprüft.",
    ],
    en: [
      "Journal",
      "Sourcing, storage, product guides and gifting ideas—editorially prepared and reviewed before publication.",
    ],
  },
  faq: {
    de: [
      "Häufige Fragen",
      "Antworten zu Produkten, Zahlung, Versand und Rückgabe werden nach Bestätigung der Geschäftsregeln veröffentlicht.",
    ],
    en: [
      "Frequently asked questions",
      "Answers about products, payment, shipping and returns will be published after business rules are confirmed.",
    ],
  },
  shipping: {
    de: [
      "Versand & Lieferung",
      "Versanddienstleister, Preise und Lieferzusagen müssen vor dem Start bestätigt werden.",
    ],
    en: [
      "Shipping & delivery",
      "The carrier, rates and delivery promises must be confirmed before launch.",
    ],
    legal: true,
  },
  returns: {
    de: [
      "Rückgabe & Erstattung",
      "Eine rechtlich geprüfte Rückgabe- und Erstattungsrichtlinie ist vor dem Start erforderlich.",
    ],
    en: [
      "Returns & refunds",
      "A legally reviewed returns and refund policy is required before launch.",
    ],
    legal: true,
  },
  privacy: {
    de: [
      "Datenschutzerklärung",
      "Eine rechtlich geprüfte Datenschutzerklärung ist vor dem Start erforderlich.",
    ],
    en: [
      "Privacy policy",
      "A legally reviewed privacy policy is required before launch.",
    ],
    legal: true,
  },
  terms: {
    de: [
      "Allgemeine Geschäftsbedingungen",
      "Rechtlich geprüfte Allgemeine Geschäftsbedingungen sind vor dem Start erforderlich.",
    ],
    en: [
      "Terms and conditions",
      "Legally reviewed terms and conditions are required before launch.",
    ],
    legal: true,
  },
  withdrawal: {
    de: [
      "Widerrufsbelehrung",
      "Eine rechtlich geprüfte Widerrufsbelehrung mit Musterformular ist vor dem Start erforderlich.",
    ],
    en: [
      "Withdrawal policy",
      "A legally reviewed withdrawal policy and model form are required before launch.",
    ],
    legal: true,
  },
  impressum: {
    de: [
      "Impressum",
      "Die vollständige Anschrift, Registrierung, USt-ID und Aufsichtsangaben sind vor dem Start erforderlich.",
    ],
    en: [
      "Legal notice",
      "The full address, registration, VAT ID and supervisory details are required before launch.",
    ],
    legal: true,
  },
  "cookie-settings": {
    de: [
      "Cookie-Einstellungen",
      "Notwendige Cookies sind für Anmeldung und Warenkorb erforderlich. Analyse, Marketing und Präferenzen bleiben deaktiviert, bis Sie ausdrücklich zustimmen.",
    ],
    en: [
      "Cookie settings",
      "Necessary cookies support sign-in and cart functions. Analytics, marketing and preferences remain disabled until you explicitly consent.",
    ],
    noindex: true,
  },
  wishlist: {
    de: [
      "Wunschliste",
      "Melden Sie sich an, um Ihre Wunschliste geräteübergreifend zu speichern.",
    ],
    en: ["Wishlist", "Sign in to save your wishlist across devices."],
    noindex: true,
  },
  "order/cancelled": {
    de: [
      "Zahlung abgebrochen",
      "Ihre Zahlung wurde nicht bestätigt. Reservierter Bestand wird automatisch freigegeben.",
    ],
    en: [
      "Payment cancelled",
      "Your payment was not confirmed. Reserved stock will be released automatically.",
    ],
    noindex: true,
  },
  "order/success": {
    de: [
      "Zahlung wird bestätigt",
      "Wir prüfen die Zahlung anhand des signierten Stripe-Webhooks. Diese Seite allein markiert keine Bestellung als bezahlt.",
    ],
    en: [
      "Your payment is being confirmed",
      "We verify payment through the signed Stripe webhook. This page alone never marks an order as paid.",
    ],
    noindex: true,
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; content: string[] }>;
}): Promise<Metadata> {
  const { locale, content } = await params;
  const page = pages[content.join("/")];
  if (!page || !isLocale(locale)) return {};
  const copy = page[locale];
  return {
    title: copy[0],
    description: copy[1],
    robots:
      page.noindex || page.legal ? { index: false, follow: false } : undefined,
  };
}
export default async function ContentPage({
  params,
}: {
  params: Promise<{ locale: string; content: string[] }>;
}) {
  const { locale, content } = await params;
  if (!isLocale(locale)) notFound();
  const page = pages[content.join("/")];
  if (!page) notFound();
  const [title, body] = page[locale];
  return (
    <div className="content-page container">
      <p className="eyebrow">Khan Dry Fruit · Duisburg</p>
      <h1>{title}</h1>
      {page.legal && (
        <div className="legal-warning">
          {locale === "de"
            ? "Entwicklungsplatzhalter – nicht als Rechtsberatung oder fertiger Rechtstext verwenden."
            : "Development placeholder—not legal advice or production-ready legal text."}
        </div>
      )}
      <p className={page.legal ? "placeholder-copy" : "lead-copy"}>{body}</p>
      <div className="content-actions">
        <Link className="button" href="/shop" locale={locale}>
          {locale === "de" ? "Shop entdecken" : "Explore shop"}
        </Link>
        <Link className="button secondary" href="/contact" locale={locale}>
          {locale === "de" ? "Kontakt" : "Contact"}
        </Link>
      </div>
    </div>
  );
}
