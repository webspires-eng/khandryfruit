import "server-only";

import type { AppLocale } from "@/config/site";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { logger } from "@/lib/logging/logger";
import {
  paginate,
  rankProducts,
  type Paginated,
  type SearchableProduct,
} from "@/lib/search/rank";
import { getProducts } from "@/server/repositories/catalogue";
import type { CatalogueProduct } from "@/types/commerce";

export const SEARCH_PAGE_SIZE = 12;

export type ProductSearchResult = {
  query: string;
  results: Paginated<CatalogueProduct>;
  suggestion: string | null;
};

const FALLBACK_POPULAR: Record<AppLocale, string[]> = {
  de: ["Rosinen", "Feigen", "Maulbeeren", "Aprikosen", "Geschenkbox"],
  en: ["Raisins", "Figs", "Mulberries", "Apricots", "Gift box"],
};

async function loadAliases(locale: AppLocale): Promise<Map<string, string[]>> {
  if (!env.DATABASE_URL) return new Map();
  try {
    const aliases = await db.productSearchAlias.findMany({
      where: { locale },
      select: { productId: true, alias: true },
    });
    const byProduct = new Map<string, string[]>();
    for (const alias of aliases) {
      const list = byProduct.get(alias.productId) ?? [];
      list.push(alias.alias);
      byProduct.set(alias.productId, list);
    }
    return byProduct;
  } catch {
    return new Map();
  }
}

/**
 * Locale-aware product search over the catalogue repository (which already
 * applies the production ACTIVE-only gate and the development fallback) plus
 * curated search aliases. Ranking and pagination happen in-process — the
 * catalogue is small and this keeps behaviour identical with and without a
 * database connection.
 */
export async function searchProducts(
  locale: AppLocale,
  query: string,
  page = 1,
): Promise<ProductSearchResult> {
  const trimmed = query.trim().slice(0, 80);
  if (!trimmed)
    return {
      query: trimmed,
      results: paginate<CatalogueProduct>([], 1, SEARCH_PAGE_SIZE),
      suggestion: null,
    };

  const [products, aliases] = await Promise.all([
    getProducts(locale),
    loadAliases(locale),
  ]);
  const searchable: SearchableProduct[] = products.map((product) => ({
    ...product,
    searchAliases: aliases.get(product.id) ?? [],
  }));
  const ranking = rankProducts(searchable, trimmed, {
    includeDrafts: env.NODE_ENV !== "production",
  });
  const results = paginate(
    ranking.results.map((entry) => entry.product as CatalogueProduct),
    page,
    SEARCH_PAGE_SIZE,
  );

  logger.info("search_performed", {
    locale,
    queryLength: trimmed.length,
    results: results.total,
    page: results.page,
  });

  return { query: trimmed, results, suggestion: ranking.suggestion };
}

/** Lightweight name suggestions for the header search overlay. */
export async function suggestProducts(
  locale: AppLocale,
  query: string,
  limit = 5,
): Promise<Array<{ name: string; slug: string }>> {
  const { results } = await searchProducts(locale, query, 1);
  return results.items
    .slice(0, limit)
    .map((product) => ({ name: product.name, slug: product.slug }));
}

/** Popular searches are configurable via the `search.popularQueries` setting. */
export async function getPopularSearches(locale: AppLocale): Promise<string[]> {
  if (!env.DATABASE_URL) return FALLBACK_POPULAR[locale];
  try {
    const setting = await db.siteSetting.findUnique({
      where: { key: "search.popularQueries" },
    });
    const value = setting?.value as Record<string, unknown> | undefined;
    const list = value?.[locale];
    if (Array.isArray(list) && list.every((item) => typeof item === "string"))
      return list.slice(0, 8);
    return FALLBACK_POPULAR[locale];
  } catch {
    return FALLBACK_POPULAR[locale];
  }
}
