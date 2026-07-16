import type { Metadata } from "next";
import { Gift } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { localizedPath } from "@/config/routes";
import { isLocale } from "@/config/site";
import { FixedGiftBoxPurchase } from "@/features/gift-boxes/fixed-box-purchase";
import { formatMoney } from "@/lib/commerce/money";
import { giftOccasionValues } from "@/lib/validation/schemas";
import { Link } from "@/i18n/navigation";
import { getGiftBoxBySlug } from "@/server/repositories/gift-boxes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const box = await getGiftBoxBySlug(locale, slug);
  if (!box) return {};
  const base = localizedPath("giftBoxes", locale);
  return {
    title: box.seoTitle || box.name,
    description: box.metaDescription || box.description,
    robots: box.status === "DRAFT" ? { index: false, follow: false } : undefined,
    alternates: {
      canonical: `/${locale}${base}/${box.slug}`,
      languages: {
        de: `/de${localizedPath("giftBoxes", "de")}/${box.alternateSlugs.de ?? box.slug}`,
        en: `/en${localizedPath("giftBoxes", "en")}/${box.alternateSlugs.en ?? box.slug}`,
      },
    },
  };
}

export default async function GiftBoxDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const [t, tCommon, box] = await Promise.all([
    getTranslations("giftBoxes"),
    getTranslations("common"),
    getGiftBoxBySlug(locale, slug),
  ]);
  if (!box) notFound();
  if (process.env.NODE_ENV === "production" && box.status !== "ACTIVE") notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const productSchema =
    box.status === "ACTIVE"
      ? {
          "@context": "https://schema.org",
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
        }
      : null;

  return (
    <div className="page-shell container">
      <nav className="breadcrumbs" aria-label="Breadcrumbs">
        <Link href="/" locale={locale}>
          {tCommon("breadcrumbHome")}
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href={localizedPath("giftBoxes", locale)} locale={locale}>
          {t("title")}
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{box.name}</span>
      </nav>

      <div className="product-main">
        <div className="product-gallery">
          <div className="gift-box-visual">
            {box.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={box.imageUrl} alt={box.name} />
            ) : (
              <Gift size={72} aria-hidden="true" />
            )}
          </div>
        </div>
        <div className="product-info">
          {box.status === "DRAFT" && (
            <span className="draft-badge">{tCommon("draftBadge")}</span>
          )}
          <div className="occasion-chips">
            {box.occasions.map((value) => (
              <span key={value}>
                {(giftOccasionValues as readonly string[]).includes(value)
                  ? t(`occasions.${value}`)
                  : value}
              </span>
            ))}
          </div>
          <h1>{box.name}</h1>
          <p className="product-lead">{box.description}</p>

          <section aria-labelledby="box-contents">
            <h2 id="box-contents">{t("detail.contentsTitle")}</h2>
            <ul className="cart-gift-contents">
              {box.items.map((item) => (
                <li key={item.variantId}>
                  {item.quantity} × {item.productName} (
                  {item.weightGrams >= 1000
                    ? `${item.weightGrams / 1000} kg`
                    : `${item.weightGrams} g`}
                  )
                </li>
              ))}
            </ul>
          </section>

          <div className="purchase-panel">
            <div className="purchase-price">
              <strong>{formatMoney(box.priceCents, locale)}</strong>
              <span className="muted">{t("detail.priceNote")}</span>
            </div>
            <p className="stock-line">
              {box.available ? tCommon("inStock") : t("detail.outOfStock")}
            </p>
            <FixedGiftBoxPurchase
              locale={locale}
              slug={box.slug}
              available={box.available}
            />
          </div>

          <Link
            className="text-link"
            href={localizedPath("giftBoxes", locale)}
            locale={locale}
          >
            ← {t("detail.backToCatalogue")}
          </Link>
        </div>
      </div>

      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productSchema).replace(/</g, "\\u003c"),
          }}
        />
      )}
    </div>
  );
}
