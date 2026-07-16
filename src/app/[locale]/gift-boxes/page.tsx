import type { Metadata } from "next";
import { Gift } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { localizedHref, localizedPath } from "@/config/routes";
import { isLocale } from "@/config/site";
import { formatMoney } from "@/lib/commerce/money";
import { Link } from "@/i18n/navigation";
import { getFixedGiftBoxes } from "@/server/repositories/gift-boxes";
import { giftOccasionValues } from "@/lib/validation/schemas";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "giftBoxes" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: localizedHref("giftBoxes", locale),
      languages: {
        de: localizedHref("giftBoxes", "de"),
        en: localizedHref("giftBoxes", "en"),
      },
    },
  };
}

export default async function GiftBoxesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ occasion?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { occasion } = await searchParams;
  const [t, tCommon, boxes] = await Promise.all([
    getTranslations("giftBoxes"),
    getTranslations("common"),
    getFixedGiftBoxes(locale),
  ]);
  const activeOccasion =
    occasion && (giftOccasionValues as readonly string[]).includes(occasion)
      ? occasion
      : null;
  const visibleBoxes = activeOccasion
    ? boxes.filter((box) => box.occasions.includes(activeOccasion))
    : boxes;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("metaTitle"),
    itemListElement: boxes
      .filter((box) => box.status === "ACTIVE")
      .map((box, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: box.name,
          description: box.description,
          url: `${siteUrl}/${locale}${localizedPath("giftBoxes", locale)}/${box.slug}`,
          offers: {
            "@type": "Offer",
            priceCurrency: "EUR",
            price: (box.priceCents / 100).toFixed(2),
            availability: box.available
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        },
      })),
  };

  return (
    <div className="page-shell container">
      <header className="page-hero">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p className="lead-copy">{t("lead")}</p>
      </header>

      <div className="section-cta">
        <div>
          <h2>{t("buildYourOwnTitle")}</h2>
          <p>{t("buildYourOwnLead")}</p>
        </div>
        <Link
          className="button light"
          href={localizedPath("giftBoxBuilder", locale)}
          locale={locale}
        >
          {t("buildYourOwnCta")}
        </Link>
      </div>

      <section className="section" aria-labelledby="occasion-links">
        <div className="section-heading">
          <h2 id="occasion-links">{t("occasionLinksTitle")}</h2>
        </div>
        <ul className="chip-list">
          {giftOccasionValues.map((value) => (
            <li key={value}>
              <a
                href={`/${locale}${localizedPath("giftBoxes", locale)}?occasion=${value}`}
                aria-current={activeOccasion === value ? "true" : undefined}
              >
                {t(`occasions.${value}`)}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="fixed-boxes">
        <div className="section-heading">
          <h2 id="fixed-boxes">{t("fixedTitle")}</h2>
        </div>
        {visibleBoxes.length === 0 ? (
          <div className="empty-state">
            <h2>{t("empty.title")}</h2>
            <p>{t("empty.body")}</p>
            <div className="content-actions">
              <Link
                className="button"
                href={localizedPath("giftBoxBuilder", locale)}
                locale={locale}
              >
                {t("buildYourOwnCta")}
              </Link>
              <Link className="button secondary" href="/shop" locale={locale}>
                Shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="gift-box-grid">
            {visibleBoxes.map((box) => (
              <article className="gift-box-card" key={box.id}>
                <div className="gift-box-visual">
                  {box.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={box.imageUrl} alt={box.name} />
                  ) : (
                    <Gift size={48} aria-hidden="true" />
                  )}
                  {box.status === "DRAFT" && (
                    <span className="draft-badge">{tCommon("draftBadge")}</span>
                  )}
                </div>
                <div className="gift-box-card-body">
                  <div className="occasion-chips">
                    {box.occasions.slice(0, 3).map((value) => (
                      <span key={value}>
                        {(giftOccasionValues as readonly string[]).includes(value)
                          ? t(`occasions.${value}`)
                          : value}
                      </span>
                    ))}
                  </div>
                  <h3>{box.name}</h3>
                  <p>{box.description}</p>
                  <div className="gift-box-price">
                    <strong>{formatMoney(box.priceCents, locale)}</strong>
                    <span className="muted">
                      {box.available
                        ? tCommon("inStock")
                        : tCommon("outOfStock")}
                    </span>
                  </div>
                  <Link
                    className="button secondary"
                    href={`${localizedPath("giftBoxes", locale)}/${box.slug}`}
                    locale={locale}
                  >
                    {t("viewDetails")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {itemListSchema.itemListElement.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(itemListSchema).replace(/</g, "\\u003c"),
          }}
        />
      )}
    </div>
  );
}
