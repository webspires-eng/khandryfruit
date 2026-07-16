import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { localizedHref } from "@/config/routes";
import { isLocale } from "@/config/site";
import { GiftBoxBuilder, type BuilderInitialState } from "@/features/gift-boxes/builder";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import {
  getBuilderProducts,
  getBuilderTemplates,
  getPackagingOptions,
} from "@/server/repositories/gift-boxes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "giftBoxBuilder" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: localizedHref("giftBoxBuilder", locale),
      languages: {
        de: localizedHref("giftBoxBuilder", "de"),
        en: localizedHref("giftBoxBuilder", "en"),
      },
    },
  };
}

async function loadInitialState(
  editId: string | undefined,
): Promise<BuilderInitialState | null> {
  if (!editId || !env.DATABASE_URL) return null;
  try {
    const configuration = await db.giftBoxConfiguration.findUnique({
      where: { id: editId },
      include: { items: true },
    });
    if (!configuration || configuration.status !== "IN_CART") return null;
    return {
      replaceConfigurationId: configuration.id,
      giftBoxId: configuration.giftBoxId,
      packagingOptionId: configuration.packagingOptionId,
      occasion: configuration.occasion,
      giftMessage: configuration.giftMessage ?? "",
      items: configuration.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    };
  } catch {
    return null;
  }
}

export default async function BuildYourOwnPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { edit } = await searchParams;
  const [t, templates, products, packaging, initial] = await Promise.all([
    getTranslations("giftBoxBuilder"),
    getBuilderTemplates(locale),
    getBuilderProducts(locale),
    getPackagingOptions(locale),
    loadInitialState(edit),
  ]);

  return (
    <div className="page-shell container">
      <header className="page-hero">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p className="lead-copy">{t("lead")}</p>
      </header>
      <GiftBoxBuilder
        locale={locale}
        templates={templates}
        products={products}
        packaging={packaging}
        initial={initial}
      />
    </div>
  );
}
