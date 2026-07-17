import {
  ArrowRight,
  Box,
  CreditCard,
  Leaf,
  MapPin,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/storefront/product-card";
import { isLocale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { getProducts } from "@/server/repositories/catalogue";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const products = await getProducts(locale, { featured: true });
  const de = locale === "de";
  const categories = [
    [
      de ? "rosinen" : "raisins",
      de ? "Rosinen" : "Raisins",
      de
        ? "Von dunkel und weich bis hell und fein."
        : "From dark and soft to light and delicate.",
      "/images/products/black-raisins.webp",
    ],
    [
      de ? "feigen" : "figs",
      de ? "Feigen" : "Figs",
      de
        ? "Bestätigtes Herkunftsbeispiel: Kandahar."
        : "Confirmed sourcing example: Kandahar.",
      "/images/products/figs.webp",
    ],
    [
      de ? "maulbeeren" : "mulberries",
      de ? "Maulbeeren" : "Mulberries",
      de ? "Aus der Region Shamali." : "From the Shamali region.",
      "/images/products/white-mulberries.webp",
    ],
    [
      "geschenkboxen",
      de ? "Geschenkboxen" : "Gift boxes",
      de
        ? "Für besondere Momente zusammengestellt."
        : "Composed for meaningful occasions.",
      "/images/products/pistachios.webp",
    ],
  ];
  return (
    <>
      <section className="hero">
        <div className="hero-inner container">
          <div className="hero-copy">
            <p className="eyebrow gold">{t("eyebrow")}</p>
            <h1>{t("title")}</h1>
            <p className="hero-subtitle">{t("subtitle")}</p>
            <div className="hero-actions">
              <Link className="button" href="/shop" locale={locale}>
                {t("shopCta")} <ArrowRight size={18} />
              </Link>
              <Link
                className="button secondary"
                href="/sourcing"
                locale={locale}
              >
                {t("sourceCta")}
              </Link>
            </div>
            <div className="hero-proof">
              <span>
                <ShieldCheck size={17} /> Stripe
              </span>
              <span>
                <MapPin size={17} /> Duisburg
              </span>
              <span>
                <PackageCheck size={17} />{" "}
                {de ? "Sorgfältig verpackt" : "Packed with care"}
              </span>
            </div>
          </div>
          <div
            className="hero-art"
            role="img"
            aria-label={
              de
                ? "Anordnung ausgewählter Trockenfrüchte in warmen Naturtönen"
                : "Arrangement of selected dry fruits in warm natural tones"
            }
          >
            <div className="hero-product-grid" aria-hidden="true">
              {[
                "/images/products/apricots.webp",
                "/images/products/green-raisins.webp",
                "/images/products/pistachios.webp",
                "/images/products/black-mulberries.webp",
              ].map((src) => (
                <span key={src}>
                  <Image src={src} alt="" fill sizes="18vw" />
                </span>
              ))}
            </div>
            <div className="hero-label">
              <small>{de ? "Ausgewählt in" : "Selected in"}</small>
              <strong>Duisburg</strong>
            </div>
          </div>
        </div>
      </section>
      <section className="trust-strip">
        <div className="trust-grid container">
          <div>
            <Leaf />
            <span>
              <strong>{de ? "Afghanische Auswahl" : "Afghan selection"}</strong>
              <small>
                {de
                  ? "Bestätigte Regionen klar benannt"
                  : "Confirmed regions clearly named"}
              </small>
            </span>
          </div>
          <div>
            <CreditCard />
            <span>
              <strong>{de ? "Sicher bezahlen" : "Secure payment"}</strong>
              <small>Stripe Checkout</small>
            </span>
          </div>
          <div>
            <Box />
            <span>
              <strong>{de ? "Geschenkfähig" : "Gift-worthy"}</strong>
              <small>
                {de
                  ? "Warme, wertige Präsentation"
                  : "Warm, premium presentation"}
              </small>
            </span>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{de ? "Kollektion" : "Collection"}</p>
            <h2>{t("categories")}</h2>
          </div>
          <Link className="text-link" href="/shop" locale={locale}>
            {de ? "Alles ansehen" : "View all"} <ArrowRight size={16} />
          </Link>
        </div>
        <div className="category-grid">
          {categories.map(([slug, name, description, image], index) => (
            <Link
              href={
                slug === "geschenkboxen" ? "/gift-boxes" : `/category/${slug}`
              }
              locale={locale}
              className={`category-card category-${index + 1}`}
              key={slug}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 25vw"
                className="category-image"
              />
              <span className="category-number">0{index + 1}</span>
              <div>
                <h3>{name}</h3>
                <p>{description}</p>
              </div>
              <ArrowRight />
            </Link>
          ))}
        </div>
      </section>
      <section className="section products-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {de ? "Für den Start ausgewählt" : "Selected for launch"}
              </p>
              <h2>{t("bestsellers")}</h2>
            </div>
            <p className="section-note">
              {de
                ? "Die sichtbaren Artikel sind Entwicklungsentwürfe bis alle Pflichtdaten freigegeben sind."
                : "Visible items remain development drafts until mandatory data is approved."}
            </p>
          </div>
          <div className="product-grid">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        </div>
      </section>
      <section className="story-section">
        <div className="story-grid container">
          <div className="origin-map" aria-hidden="true">
            <span className="map-shape" />
            <span className="pin pin-1">Kabul</span>
            <span className="pin pin-2">Kandahar</span>
            <span className="pin pin-3">Logar</span>
            <span className="pin pin-4">Shamali</span>
          </div>
          <div>
            <p className="eyebrow gold">
              {de ? "Herkunft mit Klarheit" : "Sourcing with clarity"}
            </p>
            <h2>{t("storyTitle")}</h2>
            <p>{t("storyBody")}</p>
            <p>
              {de
                ? "Wir veröffentlichen keine Grower-, Bio- oder Fair-Trade-Behauptung ohne geprüften Nachweis."
                : "We do not publish grower, organic or fair-trade claims without verified evidence."}
            </p>
            <Link className="button light" href="/sourcing" locale={locale}>
              {de ? "Herkunft entdecken" : "Explore sourcing"}{" "}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="quality-card">
          <div>
            <p className="eyebrow">Khan Dry Fruit</p>
            <h2>{t("qualityTitle")}</h2>
          </div>
          <div className="quality-list">
            <div>
              <strong>01</strong>
              <span>
                <b>{de ? "Fakten vor Behauptungen" : "Facts before claims"}</b>
                <small>
                  {de
                    ? "Nur verifizierte Produktangaben werden veröffentlicht."
                    : "Only verified product information is published."}
                </small>
              </span>
            </div>
            <div>
              <strong>02</strong>
              <span>
                <b>{de ? "Klare Pflichtangaben" : "Clear food information"}</b>
                <small>
                  {de
                    ? "Zutaten, Allergene, Herkunft und Nährwerte gehören zum Freigabeprozess."
                    : "Ingredients, allergens, origin and nutrition are part of publishing."}
                </small>
              </span>
            </div>
            <div>
              <strong>03</strong>
              <span>
                <b>{de ? "Sicherer Handel" : "Reliable commerce"}</b>
                <small>
                  {de
                    ? "Preise und Bestand werden serverseitig geprüft."
                    : "Prices and stock are verified server-side."}
                </small>
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="newsletter">
        <div className="newsletter-inner container">
          <div>
            <p className="eyebrow gold">Newsletter</p>
            <h2>{t("newsletterTitle")}</h2>
            <p>{t("newsletterBody")}</p>
          </div>
          <form className="newsletter-form">
            <label htmlFor="newsletter-email">E-Mail</label>
            <div>
              <input
                id="newsletter-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                required
              />
              <button className="button" type="submit">
                {de ? "Anmelden" : "Subscribe"}
              </button>
            </div>
            <small>
              {de
                ? "Mit der Anmeldung stimmen Sie der Verarbeitung gemäß Datenschutzerklärung zu."
                : "By subscribing you agree to processing under the privacy notice."}
            </small>
          </form>
        </div>
      </section>
    </>
  );
}
