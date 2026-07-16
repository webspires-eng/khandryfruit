import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { defaultLocale, isLocale } from "@/config/site";

export default async function NotFound() {
  const requestLocale = (await headers()).get("x-next-intl-locale");
  const locale =
    requestLocale && isLocale(requestLocale) ? requestLocale : defaultLocale;
  const t = await getTranslations({ locale, namespace: "errors" });
  return (
    <main className="empty-state large">
      <p className="eyebrow">404</p>
      <h1>{t("notFoundTitle")}</h1>
      <p>{t("notFoundText")}</p>
      <div className="content-actions">
        <Link className="button" href={`/${locale}`}>
          {t("home")}
        </Link>
        <Link className="button secondary" href={`/${locale}/shop`}>
          {t("browseProducts")}
        </Link>
      </div>
    </main>
  );
}
