import "server-only";
import { db } from "@/lib/db/client";
import { productPublicationBlockers } from "@/lib/commerce/publication";
import { isPlaceholder } from "@/lib/i18n/content";

export async function getProductReadiness(productId: string) {
  const product = await db.product.findUnique({ where: { id: productId }, include: { translations: true, variants: { include: { inventory: true } }, images: true, nutrition: true, categories: true, claims: true } });
  if (!product) return null;
  const german = product.translations.find((translation) => translation.locale === "de");
  const blockers = productPublicationBlockers({ germanName: german?.name, germanSlug: german?.slug, categoryId: product.categories[0]?.categoryId, variants: product.variants.filter((variant) => variant.active).map((variant) => ({ priceCents: variant.priceCents, weightGrams: variant.weightGrams, inventoryConfigured: Boolean(variant.inventory) })), ingredientsDe: cleanPlaceholder(german?.ingredients), allergenDe: cleanPlaceholder(german?.allergenStatement), nutritionComplete: Boolean(product.nutrition), countryOfOrigin: product.countryOfOrigin ?? undefined, responsibleFoodBusiness: product.responsibleFoodBusiness ?? undefined, imageCount: product.images.length, seoTitleDe: german?.seoTitle, metaDescriptionDe: german?.metaDescription, claims: product.claims.map((claim) => ({ enabled: claim.enabled, verified: claim.verified })) });
  const totalChecks = 10;
  return { product, blockers, score: Math.max(0, Math.round(((totalChecks - Math.min(blockers.length, totalChecks)) / totalChecks) * 100)), ready: blockers.length === 0 };
}

function cleanPlaceholder(value?: string) {
  return value && !isPlaceholder(value) ? value : undefined;
}

export async function countBlockedProducts() { const ids = await db.product.findMany({ where: { status: { in: ["DRAFT", "ACTIVE"] }, deletedAt: null }, select: { id: true } }); const results = await Promise.all(ids.map(({ id }) => getProductReadiness(id))); return results.filter((result) => result && !result.ready).length; }
