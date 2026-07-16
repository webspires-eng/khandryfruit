import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp";
import { isLocale, locales } from "@/config/site";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const de = locale === "de";
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: {
      default: de
        ? "Khan Dry Fruit | Afghanische Trockenfrüchte"
        : "Khan Dry Fruit | Premium Afghan Dry Fruits",
      template: `%s | Khan Dry Fruit`,
    },
    description: de
      ? "Ausgewählte afghanische Trockenfrüchte und Geschenkideen aus Duisburg."
      : "Selected Afghan dry fruits and gifting ideas from Duisburg.",
    alternates: { languages: { de: "/de", en: "/en" } },
    openGraph: {
      siteName: "Khan Dry Fruit",
      locale: de ? "de_DE" : "en_DE",
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "common" });
  return (
    <NextIntlClientProvider messages={messages}>
      <a href="#main" className="skip-link">
        {t("skipToContent")}
      </a>
      <Header locale={locale} />
      <main id="main">{children}</main>
      <Footer locale={locale} />
      <WhatsAppButton locale={locale} />
    </NextIntlClientProvider>
  );
}
