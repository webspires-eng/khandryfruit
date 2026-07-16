import { localizedPath } from "@/config/routes";
import type { AppLocale } from "@/config/site";
import { Link } from "@/i18n/navigation";

export function Footer({ locale }: { locale: AppLocale }) {
  const de = locale === "de";
  return (
    <footer className="footer">
      <div className="footer-grid container">
        <div>
          <div className="brand footer-brand">
            <span className="brand-mark">K</span>
            <span>
              <strong>Khan</strong>
              <small>Dry Fruit</small>
            </span>
          </div>
          <p>
            {de
              ? "Ausgewählte afghanische Trockenfrüchte, mit Sorgfalt in Duisburg präsentiert."
              : "Selected Afghan dry fruits, thoughtfully presented in Duisburg."}
          </p>
          <p className="muted">@khandryfruit</p>
        </div>
        <div>
          <h2>{de ? "Entdecken" : "Explore"}</h2>
          <Link href="/shop" locale={locale}>
            {de ? "Alle Produkte" : "All products"}
          </Link>
          <Link href={localizedPath("giftBoxes", locale)} locale={locale}>
            {de ? "Geschenkboxen" : "Gift boxes"}
          </Link>
          <Link href={localizedPath("wholesale", locale)} locale={locale}>
            {de ? "Großhandel" : "Wholesale"}
          </Link>
          <Link href="/our-story" locale={locale}>
            {de ? "Unsere Geschichte" : "Our story"}
          </Link>
        </div>
        <div>
          <h2>{de ? "Hilfe" : "Help"}</h2>
          <Link href="/faq" locale={locale}>
            FAQ
          </Link>
          <Link href="/shipping" locale={locale}>
            {de ? "Versand" : "Shipping"}
          </Link>
          <Link href="/returns" locale={locale}>
            {de ? "Rückgabe" : "Returns"}
          </Link>
          <Link href={localizedPath("contact", locale)} locale={locale}>
            {de ? "Kontakt" : "Contact"}
          </Link>
        </div>
        <div>
          <h2>{de ? "Rechtliches" : "Legal"}</h2>
          <Link href="/impressum" locale={locale}>
            Impressum
          </Link>
          <Link href="/privacy" locale={locale}>
            {de ? "Datenschutz" : "Privacy"}
          </Link>
          <Link href="/terms" locale={locale}>
            AGB / Terms
          </Link>
          <Link href="/withdrawal" locale={locale}>
            {de ? "Widerruf" : "Withdrawal"}
          </Link>
          <Link href="/cookie-settings" locale={locale}>
            Cookies
          </Link>
        </div>
      </div>
      <div className="footer-bottom container">
        <span>© {new Date().getFullYear()} Khan Dry Fruit</span>
        <span>{de ? "Duisburg, Deutschland" : "Duisburg, Germany"}</span>
      </div>
    </footer>
  );
}
