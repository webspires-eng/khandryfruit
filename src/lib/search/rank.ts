import type { CatalogueProduct } from "@/types/commerce";

import { editDistance, normalizeSearchText, tokenize } from "./normalize";

export type SearchableProduct = CatalogueProduct & {
  /** Locale-scoped alias/keyword strings (search aliases, alternative names). */
  searchAliases?: string[];
};

export type RankedResult = {
  product: SearchableProduct;
  score: number;
};

export type SearchRanking = {
  results: RankedResult[];
  /** Closest product name when only fuzzy matches were found. */
  suggestion: string | null;
};

const WEIGHTS = {
  nameExact: 120,
  namePrefix: 90,
  nameContains: 70,
  aliasExact: 100,
  aliasContains: 60,
  category: 45,
  origin: 40,
  description: 25,
  tokenOverlap: 15,
  fuzzy: 20,
} as const;

/**
 * Rank products against a free-text query. Field weights favour the localized
 * product name and curated aliases, then category and origin, then longer
 * descriptive text — giving locale-aware ordering because all fields come
 * from the requested locale's translation.
 */
export function rankProducts(
  products: SearchableProduct[],
  query: string,
  options?: { includeDrafts?: boolean },
): SearchRanking {
  const includeDrafts = options?.includeDrafts ?? false;
  const q = normalizeSearchText(query);
  const qTokens = tokenize(query);
  if (!q) return { results: [], suggestion: null };

  let suggestion: string | null = null;
  let suggestionDistance = Number.POSITIVE_INFINITY;
  const results: RankedResult[] = [];

  for (const product of products) {
    if (!includeDrafts && product.status !== "ACTIVE") continue;
    let score = 0;

    const name = normalizeSearchText(product.name);
    if (name === q) score += WEIGHTS.nameExact;
    else if (name.startsWith(q)) score += WEIGHTS.namePrefix;
    else if (name.includes(q)) score += WEIGHTS.nameContains;

    const aliases = (product.searchAliases ?? []).map(normalizeSearchText);
    if (aliases.some((alias) => alias === q)) score += WEIGHTS.aliasExact;
    else if (aliases.some((alias) => alias.includes(q) || q.includes(alias)))
      score += WEIGHTS.aliasContains;

    const category = normalizeSearchText(product.category);
    if (category && (category.includes(q) || q.includes(category)))
      score += WEIGHTS.category;

    const origin = normalizeSearchText(
      `${product.originCountry} ${product.originRegion}`,
    );
    if (qTokens.some((token) => token.length > 2 && origin.includes(token)))
      score += WEIGHTS.origin;

    const description = normalizeSearchText(
      `${product.shortDescription} ${product.description}`,
    );
    if (description.includes(q)) score += WEIGHTS.description;

    const nameTokens = tokenize(product.name);
    const overlap = qTokens.filter(
      (token) => token.length > 2 && nameTokens.includes(token),
    ).length;
    score += overlap * WEIGHTS.tokenOverlap;

    // Typo tolerance: one fuzzy hit per product against name tokens.
    if (score === 0) {
      for (const qToken of qTokens) {
        if (qToken.length < 4) continue;
        for (const nameToken of nameTokens) {
          const distance = editDistance(qToken, nameToken, 2);
          if (distance <= 2) {
            score += WEIGHTS.fuzzy;
            if (distance < suggestionDistance) {
              suggestionDistance = distance;
              suggestion = product.name;
            }
            break;
          }
        }
        if (score > 0) break;
      }
    }

    if (score > 0) results.push({ product, score });
  }

  results.sort(
    (a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name),
  );
  const hasStrongMatch = results.some((entry) => entry.score > WEIGHTS.fuzzy);
  return { results, suggestion: hasStrongMatch ? null : suggestion };
}

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export function paginate<T>(items: T[], page: number, perPage: number): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, Math.trunc(page) || 1), totalPages);
  return {
    items: items.slice((safePage - 1) * perPage, safePage * perPage),
    total,
    page: safePage,
    perPage,
    totalPages,
  };
}
