import type { AppLocale } from "@/config/site";
import { siteConfig } from "@/config/site";
import { WhatsAppIcon } from "./brand-icons";

export function WhatsAppButton({ locale }: { locale: AppLocale }) {
  const message =
    locale === "de"
      ? "Hallo, ich habe eine Frage zu Khan Dry Fruit."
      : "Hello, I have a question about Khan Dry Fruit.";
  return (
    <a
      className="whatsapp"
      href={`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={
        locale === "de"
          ? "Khan Dry Fruit über WhatsApp kontaktieren (öffnet neuen Tab)"
          : "Contact Khan Dry Fruit on WhatsApp (opens a new tab)"
      }
    >
      <WhatsAppIcon size={26} />
    </a>
  );
}
