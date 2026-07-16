import { Heart, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { localizedPath } from "@/config/routes";
import type { AppLocale } from "@/config/site";
import { HeaderSearch } from "@/features/search/header-search";
import { Link } from "@/i18n/navigation";
import { CartLink } from "./cart-link";
import { LanguageSwitcher } from "./language-switcher";

export async function Header({ locale }: { locale: AppLocale }) {
  const t = await getTranslations("nav");
  const nav = [
    ["/shop", t("shop")],
    ["/bestsellers", t("bestsellers")],
    [localizedPath("giftBoxes", locale), t("giftBoxes")],
    [localizedPath("wholesale", locale), t("wholesale")],
    ["/our-story", t("story")],
    ["/recipes", t("recipes")],
    [localizedPath("contact", locale), t("contact")],
  ] as const;
  return (
    <>
      <div className="announcement">
        {locale === "de"
          ? "Sichere Zahlung · Sorgfältig verpackt · Support per WhatsApp"
          : "Secure payment · Packed with care · WhatsApp support"}
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Link
            href="/"
            locale={locale}
            className="brand"
            aria-label="Khan Dry Fruit home"
          >
            <span className="brand-mark">K</span>
            <span>
              <strong>Khan</strong>
              <small>Dry Fruit</small>
            </span>
          </Link>
          <nav
            className="desktop-nav"
            aria-label={locale === "de" ? "Hauptnavigation" : "Main navigation"}
          >
            {nav.map(([href, label]) => (
              <Link href={href} locale={locale} key={href}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <HeaderSearch />
            <LanguageSwitcher />
            <Link
              href="/account"
              locale={locale}
              className="icon-link"
              aria-label={t("account")}
            >
              <UserRound size={20} />
            </Link>
            <Link
              href="/wishlist"
              locale={locale}
              className="icon-link desktop-only"
              aria-label={t("wishlist")}
            >
              <Heart size={20} />
            </Link>
            <CartLink />
          </div>
        </div>
      </header>
    </>
  );
}
