import type { MetadataRoute } from "next";
import { localizedPath, type LocalizedRouteKey } from "@/config/routes";
import { getProducts } from "@/server/repositories/catalogue";
const paths = [
  "",
  "/shop",
  "/our-story",
  "/sourcing",
  "/recipes",
  "/blog",
  "/faq",
  "/shipping",
  "/returns",
  "/privacy",
  "/terms",
  "/withdrawal",
  "/impressum",
];
// Areas with locale-specific slugs (search stays out: it is noindex).
const localizedKeys: LocalizedRouteKey[] = [
  "giftBoxes",
  "giftBoxBuilder",
  "wholesale",
  "contact",
];
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticEntries: MetadataRoute.Sitemap = ["de", "en"].flatMap((locale) =>
    paths.map((path) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency:
        path === "" || path === "/shop"
          ? ("weekly" as const)
          : ("monthly" as const),
      priority: path === "" ? 1 : path === "/shop" ? 0.9 : 0.6,
      alternates: {
        languages: { de: `${base}/de${path}`, en: `${base}/en${path}` },
      },
    })),
  );
  const localizedEntries: MetadataRoute.Sitemap = (["de", "en"] as const).flatMap(
    (locale) =>
      localizedKeys.map((key) => ({
        url: `${base}/${locale}${localizedPath(key, locale)}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: {
          languages: {
            de: `${base}/de${localizedPath(key, "de")}`,
            en: `${base}/en${localizedPath(key, "en")}`,
          },
        },
      })),
  );
  // A build-time database hiccup must not fail the whole deployment; the
  // sitemap then simply omits product URLs until the next revalidation.
  const [german, english] = await Promise.all([
    getProducts("de"),
    getProducts("en"),
  ]).catch(() => [[], []]);
  const products = [
    ...german.map((product) => ({ locale: "de" as const, product })),
    ...english.map((product) => ({ locale: "en" as const, product })),
  ].filter(({ product }) => product.status === "ACTIVE");
  const productEntries: MetadataRoute.Sitemap = products.map(
    ({ locale, product }) => {
      return {
        url: `${base}/${locale}/product/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            Object.entries(product.alternateSlugs ?? {}).map(
              ([alternateLocale, slug]) => [
                alternateLocale,
                `${base}/${alternateLocale}/product/${slug}`,
              ],
            ),
          ),
        },
      };
    },
  );
  return [...staticEntries, ...localizedEntries, ...productEntries];
}
