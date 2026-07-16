import type { AppLocale } from "@/config/site";

/**
 * Storefront areas with locale-specific public URLs. The app router keeps a
 * single internal (English) segment per area; the proxy rewrites localized
 * aliases onto it and redirects mismatched slugs to the canonical form.
 */
export const localizedRoutes = {
  wholesale: { internal: "wholesale", de: "grosshandel", en: "wholesale" },
  giftBoxes: { internal: "gift-boxes", de: "geschenkboxen", en: "gift-boxes" },
  giftBoxBuilder: {
    internal: "gift-boxes/build-your-own",
    de: "geschenkboxen/selbst-zusammenstellen",
    en: "gift-boxes/build-your-own",
  },
  contact: { internal: "contact", de: "kontakt", en: "contact" },
  search: { internal: "search", de: "suche", en: "search" },
} as const;

export type LocalizedRouteKey = keyof typeof localizedRoutes;

/** Public path (without locale prefix) for a localized area. */
export function localizedPath(key: LocalizedRouteKey, locale: AppLocale) {
  return `/${localizedRoutes[key][locale]}`;
}

/** Absolute public path including the locale prefix, e.g. /de/grosshandel. */
export function localizedHref(key: LocalizedRouteKey, locale: AppLocale) {
  return `/${locale}${localizedPath(key, locale)}`;
}

type RouteResolution =
  | { action: "rewrite"; path: string }
  | { action: "redirect"; path: string }
  | null;

/**
 * Resolve an incoming localized pathname. Longest aliases are checked first so
 * nested paths (e.g. the gift-box builder) win over their parents. Suffixes
 * are preserved, which lets /de/geschenkboxen/<slug> map onto the internal
 * /de/gift-boxes/<slug> route.
 */
export function resolveLocalizedPathname(pathname: string): RouteResolution {
  const match = /^\/(de|en)(\/.*)?$/.exec(pathname);
  if (!match) return null;
  const locale = match[1] as AppLocale;
  const rest = match[2] ?? "/";

  const entries = Object.values(localizedRoutes).sort(
    (a, b) => b.internal.length - a.internal.length,
  );
  for (const entry of entries) {
    const localized = `/${entry[locale]}`;
    const internal = `/${entry.internal}`;
    const other = `/${entry[locale === "de" ? "en" : "de"]}`;

    if (rest === localized || rest.startsWith(`${localized}/`)) {
      if (localized === internal) return null;
      return {
        action: "rewrite",
        path: `/${locale}${internal}${rest.slice(localized.length)}`,
      };
    }
    // A known alias in the wrong language: send the visitor to the
    // canonical localized URL instead of serving duplicate content.
    if (
      other !== localized &&
      (rest === other || rest.startsWith(`${other}/`))
    ) {
      return {
        action: "redirect",
        path: `/${locale}${localized}${rest.slice(other.length)}`,
      };
    }
    if (
      internal !== localized &&
      internal !== other &&
      (rest === internal || rest.startsWith(`${internal}/`))
    ) {
      return {
        action: "redirect",
        path: `/${locale}${localized}${rest.slice(internal.length)}`,
      };
    }
  }
  return null;
}
