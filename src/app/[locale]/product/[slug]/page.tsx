import type { Metadata } from "next";
import { ChevronRight, Heart, MessageCircle } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProductPurchase } from "@/components/storefront/product-purchase";
import { isLocale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { getProductBySlug } from "@/server/repositories/catalogue";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getProductBySlug(locale, slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
    robots:
      product.status === "DRAFT" ? { index: false, follow: false } : undefined,
    alternates: {
      canonical: `/${locale}/product/${slug}`,
      languages: Object.fromEntries(
        Object.entries(product.alternateSlugs ?? {}).map(
          ([alternateLocale, alternateSlug]) => [
            alternateLocale,
            `/${alternateLocale}/product/${alternateSlug}`,
          ],
        ),
      ),
    },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      locale: locale === "de" ? "de_DE" : "en_DE",
      images: [{ url: product.image, alt: product.imageAlt }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "product" });
  const placeholders = await getTranslations({
    locale,
    namespace: "placeholders",
  });
  const product = await getProductBySlug(locale, slug);
  if (!product) notFound();
  const jsonLd =
    product.status === "ACTIVE"
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.shortDescription,
          sku: product.variants[0]?.sku,
          brand: { "@type": "Brand", name: "Khan Dry Fruit" },
          image: product.image,
          offers: product.variants[0]
            ? {
                "@type": "Offer",
                priceCurrency: "EUR",
                price: (product.variants[0].priceCents / 100).toFixed(2),
                availability:
                  product.variants[0].available > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
              }
            : undefined,
        }
      : null;
  return (
    <div className="product-page container">
      <nav className="breadcrumbs" aria-label={t("breadcrumbs")}>
        <Link href="/" locale={locale}>
          {t("home")}
        </Link>
        <ChevronRight size={14} />
        <Link href="/shop" locale={locale}>
          {t("shop")}
        </Link>
        <ChevronRight size={14} />
        <span>{product.name}</span>
      </nav>
      <div className="product-main">
        <div className="product-gallery">
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 52vw"
            className="product-gallery-image"
          />
          {(product.originRegion || product.originCountry) && (
            <span className="gallery-origin">
              {[product.originRegion, product.originCountry]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </div>
        <div className="product-info">
          <p className="eyebrow">
            {[product.category, product.originRegion]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h1>{product.name}</h1>
          <p className="product-lead">{product.shortDescription}</p>
          <div className="product-quick-actions">
            <button>
              <Heart size={17} /> {t("save")}
            </button>
            <a
              href="https://wa.me/4917621809185"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={17} /> {t("askQuestion")}
            </a>
          </div>
          <ProductPurchase product={product} locale={locale} />
        </div>
      </div>
      <div className="product-details">
        <section>
          <p className="eyebrow">{t("product")}</p>
          <h2>{t("descriptionOrigin")}</h2>
          <p>{product.description}</p>
          <dl>
            <div>
              <dt>{t("countryOfOrigin")}</dt>
              <dd>{product.originCountry}</dd>
            </div>
            <div>
              <dt>{t("region")}</dt>
              <dd>{product.originRegion}</dd>
            </div>
            <div>
              <dt>{t("responsibleBusiness")}</dt>
              <dd>
                {product.responsibleFoodBusiness || placeholders("business")}
              </dd>
            </div>
          </dl>
        </section>
        <section>
          <p className="eyebrow">{t("foodInformation")}</p>
          <h2>{t("ingredientsAllergens")}</h2>
          <h3>{t("ingredients")}</h3>
          <p>{product.ingredients}</p>
          <h3>{t("allergens")}</h3>
          <p>{product.allergenStatement}</p>
          <h3>{t("storage")}</h3>
          <p>{product.storageInstructions}</p>
        </section>
        <section className="nutrition">
          <p className="eyebrow">{t("per100g")}</p>
          <h2>{t("nutrition")}</h2>
          <div className="warning-box">{placeholders("nutrition")}</div>
        </section>
      </div>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
    </div>
  );
}
