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
        ? "Dunkel und weich oder hell und fein – aus Kabul."
        : "Dark and soft, or light and delicate — from Kabul.",
      "/images/products/black-raisins.webp",
    ],
    [
      de ? "feigen" : "figs",
      de ? "Feigen" : "Figs",
      de ? "Aus Kandahar." : "From Kandahar.",
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
        ? "Stellen Sie Ihre eigene zusammen."
        : "Put together one of your own.",
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
          <div className="hero-art">
            <figure className="hero-photo">
              <Image
                src="/images/products/apricots.webp"
                alt={
                  de
                    ? "Getrocknete afghanische Aprikosen in einer Schale"
                    : "Dried Afghan apricots in a bowl"
                }
                fill
                sizes="(max-width: 1100px) 100vw, 45vw"
                priority
              />
            </figure>
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
              <strong>
                {de ? "Wir nennen die Region" : "We name the region"}
              </strong>
              <small>
                {de
                  ? "Kabul, Kandahar, Logar, Shamali"
                  : "Kabul, Kandahar, Logar, Shamali"}
              </small>
            </span>
          </div>
          <div>
            <CreditCard />
            <span>
              <strong>{de ? "Sicher bezahlen" : "Pay securely"}</strong>
              <small>
                {de ? "Bezahlung über Stripe" : "Payment via Stripe"}
              </small>
            </span>
          </div>
          <div>
            <Box />
            <span>
              <strong>{de ? "Zum Verschenken" : "Made to be given"}</strong>
              <small>
                {de
                  ? "Geschenkboxen, von Hand zusammengestellt"
                  : "Gift boxes, put together to order"}
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
                ? "An den letzten Angaben zu diesen Früchten arbeiten wir noch – sobald alles geprüft ist, sind sie bestellbar."
                : "We’re still finishing the details on these — once everything is checked, they’re ready to order."}
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
          {/* Real photography of the fruit we can actually name a region for,
              rather than an illustrated map of places we only label. */}
          <div className="story-photos">
            {(
              [
                [
                  "/images/products/figs.webp",
                  "Kandahar",
                  de ? "Feigen" : "Figs",
                ],
                [
                  "/images/products/black-raisins.webp",
                  "Kabul",
                  de ? "Rosinen" : "Raisins",
                ],
                [
                  "/images/products/white-mulberries.webp",
                  "Shamali",
                  de ? "Maulbeeren" : "Mulberries",
                ],
              ] as const
            ).map(([src, region, fruit]) => (
              <figure key={region}>
                <Image
                  src={src}
                  alt={`${fruit} — ${region}`}
                  fill
                  sizes="22vw"
                />
                <figcaption>
                  <strong>{fruit}</strong>
                  <small>{region}</small>
                </figcaption>
              </figure>
            ))}
          </div>
          <div>
            <p className="eyebrow gold">
              {de ? "Woher sie kommen" : "Where it comes from"}
            </p>
            <h2>{t("storyTitle")}</h2>
            <p>{t("storyBody")}</p>
            <p>
              {de
                ? "Bio, Fair Trade, direkt vom Bauern – solche Worte stehen hier nur, wenn wir sie belegen können. Können wir es nicht, schreiben wir es nicht."
                : "Organic, fair trade, straight from the grower — those words only appear here if we can prove them. If we can’t, we don’t print them."}
            </p>
            <Link className="button light" href="/sourcing" locale={locale}>
              {de ? "Mehr zur Herkunft" : "More on sourcing"}{" "}
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
              <span>
                <b>{de ? "Lieber weniger sagen" : "We’d rather say less"}</b>
                <small>
                  {de
                    ? "Was auf der Seite steht, können wir belegen. Den Rest lassen wir weg."
                    : "If it’s written here, we can back it up. The rest we leave out."}
                </small>
              </span>
            </div>
            <div>
              <span>
                <b>
                  {de ? "Alles auf dem Etikett" : "Everything on the label"}
                </b>
                <small>
                  {de
                    ? "Zutaten, Allergene, Herkunft und Nährwerte – bevor eine Frucht in den Shop kommt."
                    : "Ingredients, allergens, origin and nutrition — before a fruit reaches the shop."}
                </small>
              </span>
            </div>
            <div>
              <span>
                <b>{de ? "Sicher bezahlen" : "Checkout you can trust"}</b>
                <small>
                  {de
                    ? "Bezahlung über Stripe. Preise und Verfügbarkeit prüfen wir bei jeder Bestellung."
                    : "Payment through Stripe. We check prices and availability on every order."}
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
