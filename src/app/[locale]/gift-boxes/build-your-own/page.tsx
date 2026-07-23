import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { localizedHref } from "@/config/routes";
import { isLocale, type AppLocale } from "@/config/site";
import {
  GiftBoxBuilder,
  type BuilderInitialState,
} from "@/features/gift-boxes/builder";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import {
  getBuilderProducts,
  getBuilderTemplates,
  getGiftBoxBySlug,
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

/**
 * Pre-fills the builder from a curated box, so "customise this box" starts from
 * its contents instead of an empty form.
 *
 * The curated box is a fixed template with its own size; the builder works in
 * sizes the customer can change, so we pick the template that matches the
 * curated size, falling back to the smallest one that can actually hold the
 * contents. Returning null simply leaves the builder empty.
 */
async function loadStateFromGiftBox(
  locale: AppLocale,
  slug: string,
): Promise<BuilderInitialState | null> {
  const [box, templates] = await Promise.all([
    getGiftBoxBySlug(locale, slug),
    getBuilderTemplates(locale),
  ]);
  if (!box?.items.length || !templates.length) return null;

  const unitsNeeded = box.items.reduce((sum, item) => sum + item.quantity, 0);
  const bySize = templates.find(
    (template) => template.sizeName === box.sizeName,
  );
  const template =
    bySize && bySize.capacityUnits >= unitsNeeded
      ? bySize
      : [...templates]
          .sort((a, b) => a.capacityUnits - b.capacityUnits)
          .find((entry) => entry.capacityUnits >= unitsNeeded);
  if (!template) return null;

  return {
    replaceConfigurationId: null,
    giftBoxId: template.id,
    packagingOptionId: null,
    occasion: null,
    giftMessage: "",
    items: box.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    })),
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
  searchParams: Promise<{ edit?: string; from?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const { edit, from } = await searchParams;
  const [t, templates, products, packaging, edited] = await Promise.all([
    getTranslations("giftBoxBuilder"),
    getBuilderTemplates(locale),
    getBuilderProducts(locale),
    getPackagingOptions(locale),
    loadInitialState(edit),
  ]);
  // Editing an existing cart line wins over starting from a curated box.
  const initial =
    edited ?? (from ? await loadStateFromGiftBox(locale, from) : null);

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
