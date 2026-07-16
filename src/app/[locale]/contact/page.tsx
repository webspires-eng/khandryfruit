import type { Metadata } from "next";
import {
  AtSign,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { localizedHref, localizedPath } from "@/config/routes";
import { isLocale, siteConfig } from "@/config/site";
import { ContactForm } from "@/features/contact/contact-form";
import { Link } from "@/i18n/navigation";
import { env } from "@/lib/env";

const PLACEHOLDER_ADMIN_EMAIL = "orders@example.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: localizedHref("contact", locale),
      languages: {
        de: localizedHref("contact", "de"),
        en: localizedHref("contact", "en"),
      },
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const common = await getTranslations("common");
  // LocalBusiness JSON-LD and a map embed are added only once the business address is verified.
  const emailConfigured = env.ADMIN_EMAIL !== PLACEHOLDER_ADMIN_EMAIL;
  const whatsappHref = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
    t("channels.whatsappMessage"),
  )}`;
  return (
    <div className="page-shell container">
      <header className="page-hero">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p className="lead-copy">{t("lead")}</p>
      </header>

      <section>
        <div className="contact-channels">
          <div className="channel-card">
            <h3>
              <Phone size={18} aria-hidden="true" /> {t("channels.phoneTitle")}
            </h3>
            <a href={`tel:${siteConfig.phoneHref}`}>{siteConfig.phoneDisplay}</a>
          </div>
          <div className="channel-card">
            <h3>
              <MessageCircle size={18} aria-hidden="true" />{" "}
              {t("channels.whatsappTitle")}
            </h3>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("channels.whatsappAria")}
            >
              {t("channels.whatsappCta")}
            </a>
          </div>
          <div className="channel-card">
            <h3>
              <Mail size={18} aria-hidden="true" /> {t("channels.emailTitle")}
            </h3>
            {emailConfigured ? (
              <>
                <a href={`mailto:${env.ADMIN_EMAIL}`}>{env.ADMIN_EMAIL}</a>
                <small>{t("channels.emailNote")}</small>
              </>
            ) : (
              <p className="pending-note">{t("channels.emailPending")}</p>
            )}
          </div>
          <div className="channel-card">
            <h3>
              <MapPin size={18} aria-hidden="true" />{" "}
              {t("channels.addressTitle")}
            </h3>
            <p className="pending-note">{t("channels.addressPending")}</p>
          </div>
          <div className="channel-card">
            <h3>
              <Clock size={18} aria-hidden="true" /> {t("channels.hoursTitle")}
            </h3>
            <p className="pending-note">{t("channels.hoursPending")}</p>
          </div>
          <div className="channel-card">
            <h3>
              <AtSign size={18} aria-hidden="true" />{" "}
              {t("channels.socialTitle")}
            </h3>
            <p>{siteConfig.socialHandle}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="section-heading">
          <h2>{t("options.title")}</h2>
        </div>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>{t("options.orderTitle")}</h3>
            <p>{t("options.orderBody")}</p>
          </div>
          <div className="feature-card">
            <h3>{t("options.wholesaleTitle")}</h3>
            <p>{t("options.wholesaleBody")}</p>
            <Link
              className="text-link"
              href={localizedPath("wholesale", locale)}
              locale={locale}
            >
              {t("options.wholesaleCta")} →
            </Link>
          </div>
          <div className="feature-card">
            <h3>{t("options.generalTitle")}</h3>
            <p>{t("options.generalBody")}</p>
          </div>
        </div>
      </section>

      <section>
        <h2>{t("formTitle")}</h2>
        <p>{t("formLead")}</p>
        <p className="muted">{common("requiredFieldsNote")}</p>
        <ContactForm locale={locale} />
      </section>
    </div>
  );
}
