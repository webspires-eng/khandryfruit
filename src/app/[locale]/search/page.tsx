import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/storefront/product-card";
import { localizedHref, localizedPath } from "@/config/routes";
import { isLocale } from "@/config/site";
import { SearchForm } from "@/features/search/search-form";
import { Link } from "@/i18n/navigation";
import { getProducts } from "@/server/repositories/catalogue";
import { getPopularSearches, searchProducts } from "@/server/services/search";
import type { CatalogueProduct } from "@/types/commerce";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "search" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: true },
    alternates: { canonical: localizedHref("search", locale) },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const query = await searchParams;
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const parsedPage =
    typeof query.page === "string" ? Number.parseInt(query.page, 10) : 1;
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [t, search, popular] = await Promise.all([
    getTranslations("search"),
    q ? searchProducts(locale, q, page) : Promise.resolve(null),
    getPopularSearches(locale),
  ]);

  const showEmptyState = search !== null && search.results.total === 0;
  let bestsellers: CatalogueProduct[] = [];
  const categories: Array<{ name: string; slug: string }> = [];
  if (showEmptyState) {
    const [bestsellerProducts, allProducts] = await Promise.all([
      getProducts(locale, { bestseller: true }),
      getProducts(locale),
    ]);
    bestsellers = bestsellerProducts.slice(0, 4);
    const seen = new Set<string>();
    for (const product of allProducts) {
      if (!product.category || !product.categorySlug) continue;
      if (seen.has(product.categorySlug)) continue;
      seen.add(product.categorySlug);
      categories.push({ name: product.category, slug: product.categorySlug });
    }
  }

  const searchBase = `/${locale}${localizedPath("search", locale)}`;
  const searchUrl = (term: string) =>
    `${searchBase}?q=${encodeURIComponent(term)}`;

  // "didYouMean" interpolates {suggestion} as a plain ICU argument (no rich
  // tag in the message), so split the formatted text around a sentinel to
  // render the suggestion itself as a link.
  const sentinel = "\u0000";
  const didYouMeanParts = search?.suggestion
    ? t("didYouMean", { suggestion: sentinel }).split(sentinel)
    : null;

  return (
    <div className="page-shell container">
      <header className="page-hero">
        <h1>{t("title")}</h1>
        <p>{t("lead")}</p>
      </header>
      <SearchForm locale={locale} initialQuery={q} />
      {!q && popular.length > 0 && (
        <div className="search-sections">
          <section>
            <h2>{t("popularTitle")}</h2>
            <ul className="chip-list">
              {popular.map((term) => (
                <li key={term}>
                  <a href={searchUrl(term)}>{term}</a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
      {search !== null && search.results.total > 0 && (
        <>
          <div className="search-meta">
            <h2>{t("resultsFor", { query: search.query })}</h2>
            <p aria-live="polite">
              {t("resultsCount", { count: search.results.total })}
            </p>
          </div>
          <div className="product-grid">
            {search.results.items.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
          {search.results.totalPages > 1 && (
            <nav
              className="pagination"
              aria-label={t("pagination.status", {
                page: search.results.page,
                total: search.results.totalPages,
              })}
            >
              {search.results.page > 1 && (
                <a
                  rel="prev"
                  href={`${searchUrl(search.query)}&page=${search.results.page - 1}`}
                >
                  {t("pagination.previous")}
                </a>
              )}
              <span>
                {t("pagination.status", {
                  page: search.results.page,
                  total: search.results.totalPages,
                })}
              </span>
              {search.results.page < search.results.totalPages && (
                <a
                  rel="next"
                  href={`${searchUrl(search.query)}&page=${search.results.page + 1}`}
                >
                  {t("pagination.next")}
                </a>
              )}
            </nav>
          )}
        </>
      )}
      {search !== null && showEmptyState && (
        <>
          <div className="empty-state large">
            <h2>{t("empty.title")}</h2>
            <p>{t("empty.body")}</p>
            <p className="muted">{t("empty.removeFilters")}</p>
            {search.suggestion && didYouMeanParts && (
              <p>
                {didYouMeanParts[0]}
                <a href={searchUrl(search.suggestion)}>
                  <strong>{search.suggestion}</strong>
                </a>
                {didYouMeanParts[1]}
              </p>
            )}
          </div>
          <div className="search-sections">
            {categories.length > 0 && (
              <section>
                <h2>{t("empty.categoriesTitle")}</h2>
                <ul className="chip-list">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <Link href={`/category/${category.slug}`} locale={locale}>
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {bestsellers.length > 0 && (
              <section>
                <h2>{t("empty.bestsellersTitle")}</h2>
                <div className="product-grid">
                  {bestsellers.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      locale={locale}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
