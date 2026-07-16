import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { isLocale } from "@/config/site";
import { getProducts } from "@/server/repositories/catalogue";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = { robots: { index: true, follow: true } };

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "shop" });
  const query = await searchParams;
  const category =
    typeof query.category === "string" ? query.category : undefined;
  const search = typeof query.q === "string" ? query.q : undefined;
  const products = await getProducts(locale, { category, query: search });
  return (
    <div className="page-shell container">
      <header className="page-hero">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
      </header>
      <div className="shop-toolbar">
        <span>
          {products.length} {t("results")}
        </span>
        <button className="filter-button">
          <SlidersHorizontal size={17} /> {t("filters")}
        </button>
        <select aria-label={t("sort")}>
          <option>{t("featured")}</option>
          <option>{t("priceAscending")}</option>
          <option>{t("nameAscending")}</option>
        </select>
      </div>
      {products.length ? (
        <div className="product-grid shop-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{t("emptyTitle")}</h2>
          <p>{t("emptyText")}</p>
        </div>
      )}
    </div>
  );
}
