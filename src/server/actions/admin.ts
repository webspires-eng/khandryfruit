"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import Papa from "papaparse";
import type { Prisma } from "@generated/prisma/client";
import { db } from "@/lib/db/client";
import {
  isRecommendedTransition,
  orderTransitions,
  ORDER_STATUSES,
  type DomainOrderStatus,
} from "@/lib/commerce/order-state";
import { confirmOrderPayment } from "@/server/services/payment-confirmation";
import { issueRefund } from "@/server/services/refunds";
import { releaseOrderReservations } from "@/server/services/stock-reservations";
import {
  sendOrderConfirmationEmails,
  sendOrderStatusEmail,
} from "@/server/services/order-notifications";
import {
  applyStockAdjustment,
  assertWholesaleTransition,
  type WholesaleState,
} from "@/lib/commerce/admin-rules";
import { slugify } from "@/lib/slug";
import {
  adminProductSchema,
  adminVariantSchema,
  categorySchema,
  couponAdminSchema,
  giftBoxAdminSchema,
  inventoryAdjustmentSchema,
  wholesaleDecisionSchema,
} from "@/lib/validation/admin-schemas";
import { requireAdmin } from "@/server/policies/authorization";
import { isSafeUrl } from "@/lib/security/safe-url";
import { getProductReadiness } from "@/server/services/product-readiness";

/** The order detail route accepts both the short number and the cuid. */
async function revalidateOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { number: true },
  });
  if (order) revalidatePath(`/admin/orders/${order.number}`);
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

function values(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

/**
 * ProductTranslation has @@unique([locale, slug]), so a derived slug must be
 * de-duplicated before it is written. Suffixes with -2, -3 … until free.
 */
async function uniqueTranslationSlug(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  locale: "de" | "en",
  base: string,
  currentProductId?: string,
) {
  const root = base || "product";
  let candidate = root;
  for (let n = 2; ; n++) {
    const existing = await tx.productTranslation.findUnique({
      where: { locale_slug: { locale, slug: candidate } },
      select: { productId: true },
    });
    if (!existing || existing.productId === currentProductId) return candidate;
    candidate = `${root}-${n}`.slice(0, 160);
  }
}
async function requestMeta() {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim(),
    correlationId: h.get("x-vercel-id") ?? crypto.randomUUID(),
  };
}
function actionError(error: unknown) {
  if (error instanceof z.ZodError)
    return {
      success: false as const,
      error: {
        code: "VALIDATION_ERROR",
        message: "Please review the highlighted information.",
        fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
      },
    };
  return {
    success: false as const,
    error: {
      code: "ADMIN_ACTION_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "The action could not be completed.",
    },
  };
}

export async function createProductAction(formData: FormData) {
  const session = await requireAdmin("products");
  let productId: string;
  try {
    const input = adminProductSchema.parse(values(formData));
    const meta = await requestMeta();
    const product = await db.$transaction(async (tx) => {
      if (input.categoryId) {
        const category = await tx.category.findFirst({
          where: { id: input.categoryId, active: true },
        });
        if (!category) throw new Error("CATEGORY_NOT_FOUND");
      }
      const translations = [
        {
          locale: "de" as const,
          name: input.nameDe,
          slug: await uniqueTranslationSlug(
            tx,
            "de",
            input.slugDe || slugify(input.nameDe || input.internalName),
          ),
          alternativeNames: [],
          keywords: [],
          shortDescription: input.shortDescriptionDe,
          description: input.descriptionDe,
          ingredients: input.ingredientsDe,
          allergenStatement: input.allergenDe,
          storageInstructions: input.storageDe,
          seoTitle: input.seoTitleDe,
          metaDescription: input.metaDescriptionDe,
        },
        ...(input.nameEn || input.slugEn
          ? [
              {
                locale: "en" as const,
                name: input.nameEn,
                slug: await uniqueTranslationSlug(
                  tx,
                  "en",
                  input.slugEn || slugify(input.nameEn || input.internalName),
                ),
                alternativeNames: [],
                keywords: [],
                shortDescription: input.shortDescriptionEn,
                description: input.descriptionEn,
                ingredients: input.ingredientsEn,
                allergenStatement: input.allergenEn,
                storageInstructions: input.storageEn,
                seoTitle: input.seoTitleEn,
                metaDescription: input.metaDescriptionEn,
              },
            ]
          : []),
      ];
      const created = await tx.product.create({
        data: {
          internalName: input.internalName,
          status: "DRAFT",
          featured: input.featured,
          bestseller: input.bestseller,
          newProduct: input.newProduct,
          giftSuitable: input.giftSuitable,
          countryOfOrigin: input.countryOfOrigin || null,
          regionOfOrigin: input.regionOfOrigin || null,
          responsibleFoodBusiness: input.responsibleFoodBusiness || null,
          translations: { create: translations },
          ...(input.categoryId
            ? {
                categories: {
                  create: { categoryId: input.categoryId, isPrimary: true },
                },
              }
            : {}),
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "PRODUCT_CREATED",
          entityType: "Product",
          entityId: created.id,
          after: { internalName: created.internalName, status: created.status },
          ...meta,
        },
      });
      return created;
    });
    productId = product.id;
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/admin/products");
  redirect(`/admin/products/${productId}`);
}

export async function updateProductAction(formData: FormData) {
  const session = await requireAdmin("products");
  try {
    const productId = z.string().min(1).parse(formData.get("productId"));
    const input = adminProductSchema.parse(values(formData));
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      const before = await tx.product.findUniqueOrThrow({
        where: { id: productId },
        include: { translations: true },
      });
      const slugDe = await uniqueTranslationSlug(
        tx,
        "de",
        input.slugDe || slugify(input.nameDe || input.internalName),
        productId,
      );
      const slugEn =
        input.nameEn || input.slugEn
          ? await uniqueTranslationSlug(
              tx,
              "en",
              input.slugEn || slugify(input.nameEn || input.internalName),
              productId,
            )
          : "";
      await tx.product.update({
        where: { id: productId },
        data: {
          internalName: input.internalName,
          featured: input.featured,
          bestseller: input.bestseller,
          newProduct: input.newProduct,
          giftSuitable: input.giftSuitable,
          countryOfOrigin: input.countryOfOrigin || null,
          regionOfOrigin: input.regionOfOrigin || null,
          responsibleFoodBusiness: input.responsibleFoodBusiness || null,
          categories: input.categoryId
            ? {
                deleteMany: {},
                create: { categoryId: input.categoryId, isPrimary: true },
              }
            : { deleteMany: {} },
          translations: {
            upsert: [
              {
                where: { productId_locale: { productId, locale: "de" } },
                create: {
                  locale: "de",
                  name: input.nameDe,
                  slug: slugDe,
                  alternativeNames: [],
                  keywords: [],
                  shortDescription: input.shortDescriptionDe,
                  description: input.descriptionDe,
                  ingredients: input.ingredientsDe,
                  allergenStatement: input.allergenDe,
                  storageInstructions: input.storageDe,
                  seoTitle: input.seoTitleDe,
                  metaDescription: input.metaDescriptionDe,
                },
                update: {
                  name: input.nameDe,
                  slug: slugDe,
                  shortDescription: input.shortDescriptionDe,
                  description: input.descriptionDe,
                  ingredients: input.ingredientsDe,
                  allergenStatement: input.allergenDe,
                  storageInstructions: input.storageDe,
                  seoTitle: input.seoTitleDe,
                  metaDescription: input.metaDescriptionDe,
                },
              },
              ...(input.nameEn || input.slugEn
                ? [
                    {
                      where: {
                        productId_locale: { productId, locale: "en" as const },
                      },
                      create: {
                        locale: "en" as const,
                        name: input.nameEn,
                        slug: slugEn,
                        alternativeNames: [],
                        keywords: [],
                        shortDescription: input.shortDescriptionEn,
                        description: input.descriptionEn,
                        ingredients: input.ingredientsEn,
                        allergenStatement: input.allergenEn,
                        storageInstructions: input.storageEn,
                        seoTitle: input.seoTitleEn,
                        metaDescription: input.metaDescriptionEn,
                      },
                      update: {
                        name: input.nameEn,
                        slug: slugEn,
                        shortDescription: input.shortDescriptionEn,
                        description: input.descriptionEn,
                        ingredients: input.ingredientsEn,
                        allergenStatement: input.allergenEn,
                        storageInstructions: input.storageEn,
                        seoTitle: input.seoTitleEn,
                        metaDescription: input.metaDescriptionEn,
                      },
                    },
                  ]
                : []),
            ],
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "PRODUCT_UPDATED",
          entityType: "Product",
          entityId: productId,
          before: { internalName: before.internalName },
          after: { internalName: input.internalName },
          ...meta,
        },
      });
    });
    revalidatePath(`/admin/products/${productId}`);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

async function setProductStatusAction(formData: FormData) {
  const session = await requireAdmin("products");
  try {
    const productId = z.string().min(1).parse(formData.get("productId"));
    const status = z
      .enum(["DRAFT", "ACTIVE", "ARCHIVED"])
      .parse(formData.get("status"));
    if (status === "ACTIVE") {
      const readiness = await getProductReadiness(productId);
      if (!readiness?.ready)
        return {
          success: false as const,
          error: {
            code: "PUBLICATION_BLOCKED",
            message: `Publication blocked: ${readiness?.blockers.join(", ") ?? "product not found"}`,
          },
        };
    }
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      const before = await tx.product.findUniqueOrThrow({
        where: { id: productId },
      });
      await tx.product.update({
        where: { id: productId },
        data: { status, publishedAt: status === "ACTIVE" ? new Date() : null },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action:
            status === "ACTIVE"
              ? "PRODUCT_PUBLISHED"
              : status === "ARCHIVED"
                ? "PRODUCT_ARCHIVED"
                : "PRODUCT_UNPUBLISHED",
          entityType: "Product",
          entityId: productId,
          before: { status: before.status },
          after: { status },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

// Wraps setProductStatusAction so the product editor gets persistent feedback:
// the outcome is encoded as a `flash` query param that survives the redirect and
// is rendered as a live region on the page.
export async function changeProductStatusAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const status = String(formData.get("status") ?? "");
  const result = await setProductStatusAction(formData);
  const params = new URLSearchParams();
  if (result.success) {
    params.set(
      "flash",
      status === "ACTIVE"
        ? "published"
        : status === "ARCHIVED"
          ? "archived"
          : "unpublished",
    );
  } else if (result.error.code === "PUBLICATION_BLOCKED") {
    const readiness = await getProductReadiness(productId);
    params.set("flash", "blocked");
    params.set("count", String(readiness?.blockers.length ?? 0));
  } else {
    params.set("flash", "error");
  }
  redirect(
    productId
      ? `/admin/products/${productId}?${params.toString()}`
      : `/admin/products?${params.toString()}`,
  );
}

export async function bulkProductAction(formData: FormData) {
  const session = await requireAdmin("products");
  try {
    const productIds = z
      .array(z.string().min(1))
      .min(1)
      .max(100)
      .parse(formData.getAll("productIds"));
    const status = z
      .enum(["DRAFT", "ARCHIVED"])
      .optional()
      .parse(formData.get("status") || undefined);
    const categoryId = z
      .string()
      .min(1)
      .optional()
      .parse(formData.get("categoryId") || undefined);
    if (!status && !categoryId) throw new Error("NO_BULK_CHANGE_SELECTED");
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      if (status)
        await tx.product.updateMany({
          where: { id: { in: productIds }, deletedAt: null },
          data: { status },
        });
      if (categoryId) {
        const category = await tx.category.findFirst({
          where: { id: categoryId, active: true },
        });
        if (!category) throw new Error("CATEGORY_NOT_FOUND");
        for (const productId of productIds) {
          await tx.productCategory.updateMany({
            where: { productId },
            data: { isPrimary: false },
          });
          await tx.productCategory.upsert({
            where: { productId_categoryId: { productId, categoryId } },
            create: { productId, categoryId, isPrimary: true },
            update: { isPrimary: true },
          });
        }
      }
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "PRODUCTS_BULK_UPDATED",
          entityType: "Product",
          after: { productIds, status, categoryId },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/products");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function createVariantAction(formData: FormData) {
  const session = await requireAdmin("products");
  try {
    const input = adminVariantSchema.parse(values(formData));
    const meta = await requestMeta();
    const variant = await db.$transaction(async (tx) => {
      const created = await tx.productVariant.create({
        data: {
          productId: input.productId,
          sku: input.sku,
          weightGrams: input.weightGrams,
          shippingWeightG: input.shippingWeightG,
          priceCents: input.priceCents,
          compareAtCents: input.compareAtCents,
          costCents: input.costCents,
          vatRateBps: input.vatRateBps,
          barcode: input.barcode || null,
          active: input.active,
          sortOrder: input.sortOrder,
          inventory: {
            create: {
              onHand: input.initialStock,
              lowStockThreshold: input.lowStockThreshold,
            },
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "VARIANT_CREATED",
          entityType: "ProductVariant",
          entityId: created.id,
          after: {
            sku: created.sku,
            priceCents: created.priceCents,
            weightGrams: created.weightGrams,
          },
          ...meta,
        },
      });
      return created;
    });
    revalidatePath(`/admin/products/${input.productId}`);
    return { success: true as const, data: { id: variant.id } };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateVariantAction(formData: FormData) {
  const session = await requireAdmin("products");
  try {
    const variantId = z.string().min(1).parse(formData.get("variantId"));
    const input = adminVariantSchema
      .omit({ productId: true, initialStock: true })
      .parse(values(formData));
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      const before = await tx.productVariant.findUniqueOrThrow({
        where: { id: variantId },
        include: { inventory: true },
      });
      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          sku: input.sku,
          weightGrams: input.weightGrams,
          shippingWeightG: input.shippingWeightG,
          priceCents: input.priceCents,
          compareAtCents: input.compareAtCents,
          costCents: input.costCents,
          vatRateBps: input.vatRateBps,
          barcode: input.barcode || null,
          active: input.active,
          sortOrder: input.sortOrder,
        },
      });
      if (before.inventory)
        await tx.inventory.update({
          where: { id: before.inventory.id },
          data: { lowStockThreshold: input.lowStockThreshold },
        });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "VARIANT_UPDATED",
          entityType: "ProductVariant",
          entityId: variantId,
          before: {
            sku: before.sku,
            priceCents: before.priceCents,
            weightGrams: before.weightGrams,
            active: before.active,
          },
          after: {
            sku: input.sku,
            priceCents: input.priceCents,
            weightGrams: input.weightGrams,
            active: input.active,
          },
          ...meta,
        },
      });
    });
    revalidatePath(`/admin/products/${formData.get("productId")}`);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function upsertNutritionAction(formData: FormData) {
  const session = await requireAdmin("products");
  try {
    const productId = z.string().min(1).parse(formData.get("productId"));
    const input = z
      .object({
        energyKj: z.coerce.number().int().min(0),
        energyKcal: z.coerce.number().int().min(0),
        fatG: z.coerce.number().min(0),
        saturatedFatG: z.coerce.number().min(0),
        carbohydratesG: z.coerce.number().min(0),
        sugarsG: z.coerce.number().min(0),
        fibreG: z.coerce.number().min(0),
        proteinG: z.coerce.number().min(0),
        saltG: z.coerce.number().min(0),
        verified: z.coerce.boolean().default(false),
      })
      .parse(values(formData));
    const { verified, ...nutrition } = input;
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      const before = await tx.nutritionData.findUnique({
        where: { productId },
      });
      await tx.nutritionData.upsert({
        where: { productId },
        create: {
          productId,
          ...nutrition,
          verifiedAt: verified ? new Date() : null,
        },
        update: { ...nutrition, verifiedAt: verified ? new Date() : null },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "PRODUCT_NUTRITION_UPDATED",
          entityType: "Product",
          entityId: productId,
          before: before ? { verified: Boolean(before.verifiedAt) } : undefined,
          after: { verified },
          ...meta,
        },
      });
    });
    revalidatePath(`/admin/products/${productId}`);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function addProductImageAction(formData: FormData) {
  const session = await requireAdmin("products");
  try {
    const input = z
      .object({
        productId: z.string().min(1),
        url: z.string().url(),
        altDe: z.string().trim().min(2).max(300),
        altEn: z.string().trim().min(2).max(300),
        sortOrder: z.coerce.number().int().min(0).max(1000),
        isPrimary: z.coerce.boolean().default(false),
      })
      .parse(values(formData));
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      if (input.isPrimary)
        await tx.productImage.updateMany({
          where: { productId: input.productId },
          data: { isPrimary: false },
        });
      const image = await tx.productImage.create({ data: input });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "PRODUCT_IMAGE_ADDED",
          entityType: "ProductImage",
          entityId: image.id,
          after: { productId: input.productId, isPrimary: input.isPrimary },
          ...meta,
        },
      });
    });
    revalidatePath(`/admin/products/${input.productId}`);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function adjustInventoryAction(formData: FormData) {
  const session = await requireAdmin("inventory");
  try {
    const input = inventoryAdjustmentSchema.parse(values(formData));
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUniqueOrThrow({
        where: { id: input.inventoryId },
      });
      const next = applyStockAdjustment(
        inventory.onHand,
        inventory.reserved,
        input.quantity,
      );
      const updated = await tx.inventory.updateMany({
        where: { id: inventory.id, version: inventory.version },
        data: {
          onHand: next.onHand,
          version: { increment: 1 },
        },
      });
      if (updated.count !== 1) throw new Error("INVENTORY_CHANGED_RETRY");
      await tx.inventoryAdjustment.create({
        data: {
          inventoryId: inventory.id,
          type: input.quantity > 0 ? "RECEIPT" : "CORRECTION",
          quantity: input.quantity,
          reason: input.reason,
          internalNote: input.internalNote || null,
          actorId: session.user.id,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "STOCK_ADJUSTED",
          entityType: "Inventory",
          entityId: inventory.id,
          before: { onHand: inventory.onHand, reserved: inventory.reserved },
          after: {
            onHand: next.onHand,
            reason: input.reason,
            change: input.quantity,
          },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/inventory");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function importInventoryCsvAction(formData: FormData) {
  const session = await requireAdmin("inventory");
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > 1_000_000)
      throw new Error("INVALID_INVENTORY_CSV");
    const parsed = Papa.parse<Record<string, string>>(await file.text(), {
      header: true,
      skipEmptyLines: true,
    });
    if (parsed.errors.length) throw new Error("INVALID_INVENTORY_CSV");
    const rows = z
      .array(
        z.object({
          sku: z
            .string()
            .trim()
            .min(3)
            .transform((v) => v.toUpperCase()),
          onHand: z.coerce.number().int().min(0),
          lowStockThreshold: z.coerce.number().int().min(0),
        }),
      )
      .min(1)
      .max(500)
      .parse(parsed.data);
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      for (const row of rows) {
        const variant = await tx.productVariant.findUnique({
          where: { sku: row.sku },
          include: { inventory: true },
        });
        if (!variant?.inventory)
          throw new Error(`INVENTORY_NOT_FOUND:${row.sku}`);
        if (row.onHand < variant.inventory.reserved)
          throw new Error(`ON_HAND_BELOW_RESERVED:${row.sku}`);
        const change = row.onHand - variant.inventory.onHand;
        await tx.inventory.update({
          where: { id: variant.inventory.id },
          data: {
            onHand: row.onHand,
            lowStockThreshold: row.lowStockThreshold,
            version: { increment: 1 },
          },
        });
        if (change !== 0)
          await tx.inventoryAdjustment.create({
            data: {
              inventoryId: variant.inventory.id,
              type: "CORRECTION",
              quantity: change,
              reason: "Stock count correction",
              internalNote: `CSV import: ${file.name}`,
              actorId: session.user.id,
            },
          });
      }
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "INVENTORY_CSV_IMPORTED",
          entityType: "Inventory",
          after: { rows: rows.length, fileName: file.name },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/inventory");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function createCategoryAction(formData: FormData) {
  const session = await requireAdmin("categories");
  try {
    const input = categorySchema.parse(values(formData));
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: {
          internalName: input.nameEn.toLowerCase().replaceAll(" ", "-"),
          parentId: input.parentId || null,
          translations: {
            create: [
              {
                locale: "de",
                name: input.nameDe,
                slug: input.slugDe,
                description: input.descriptionDe,
                seoTitle: input.seoTitleDe,
                metaDescription: input.metaDescriptionDe,
              },
              {
                locale: "en",
                name: input.nameEn,
                slug: input.slugEn,
                description: input.descriptionEn,
                seoTitle: input.seoTitleEn,
                metaDescription: input.metaDescriptionEn,
              },
            ],
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "CATEGORY_CREATED",
          entityType: "Category",
          entityId: category.id,
          after: { nameDe: input.nameDe, nameEn: input.nameEn },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/categories");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateCategoryAction(formData: FormData) {
  const session = await requireAdmin("categories");
  try {
    const id = z.string().min(1).parse(formData.get("categoryId"));
    const input = categorySchema.parse(values(formData));
    if (input.parentId === id)
      throw new Error("CATEGORY_CANNOT_BE_ITS_OWN_PARENT");
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      await tx.category.update({
        where: { id },
        data: { parentId: input.parentId || null },
      });
      const localized = [
        {
          locale: "de" as const,
          name: input.nameDe,
          slug: input.slugDe,
          description: input.descriptionDe,
          seoTitle: input.seoTitleDe,
          metaDescription: input.metaDescriptionDe,
        },
        {
          locale: "en" as const,
          name: input.nameEn,
          slug: input.slugEn,
          description: input.descriptionEn,
          seoTitle: input.seoTitleEn,
          metaDescription: input.metaDescriptionEn,
        },
      ];
      for (const translation of localized)
        await tx.categoryTranslation.upsert({
          where: {
            categoryId_locale: { categoryId: id, locale: translation.locale },
          },
          update: translation,
          create: { categoryId: id, ...translation },
        });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "CATEGORY_UPDATED",
          entityType: "Category",
          entityId: id,
          after: { nameDe: input.nameDe, nameEn: input.nameEn },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/categories");
    revalidatePath("/admin/inventory");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveCategoryAction(formData: FormData) {
  const session = await requireAdmin("categories");
  try {
    const id = z.string().min(1).parse(formData.get("categoryId"));
    const count = await db.productCategory.count({
      where: { categoryId: id, product: { status: { not: "ARCHIVED" } } },
    });
    if (count) throw new Error("CATEGORY_HAS_ACTIVE_PRODUCTS");
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      await tx.category.update({ where: { id }, data: { active: false } });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "CATEGORY_ARCHIVED",
          entityType: "Category",
          entityId: id,
          ...meta,
        },
      });
    });
    revalidatePath("/admin/categories");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function transitionOrderAction(formData: FormData) {
  const session = await requireAdmin("orders");
  try {
    const orderId = z.string().min(1).parse(formData.get("orderId"));
    // Any status is reachable: shops need to correct records after the fact.
    // This is safe because `status` carries no money — `paymentStatus` does.
    const next = z
      .enum(ORDER_STATUSES as [DomainOrderStatus, ...DomainOrderStatus[]])
      .parse(formData.get("status"));
    const note = z
      .string()
      .max(1_000)
      .optional()
      .parse(formData.get("note") || undefined);
    const meta = await requestMeta();
    const current = await db.order.findUniqueOrThrow({
      where: { id: orderId },
    });
    if (current.status === next) return { success: true as const };

    const offPath = !isRecommendedTransition(
      current.status as DomainOrderStatus,
      next,
    );

    // Confirming an unpaid order settles it, so stock converts from reserved to
    // sold and the payment row closes — the same work the Stripe webhook does.
    if (next === "CONFIRMED" && current.paymentStatus === "UNPAID") {
      await confirmOrderPayment(db, orderId, {
        reference: "admin_" + session.user.id,
      });
      await db.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "ORDER_MARKED_PAID_MANUALLY",
          entityType: "Order",
          entityId: orderId,
          before: { status: current.status, paymentStatus: "UNPAID" },
          after: { status: "CONFIRMED", paymentStatus: "PAID", note },
          ...meta,
        },
      });
      await sendOrderConfirmationEmails(orderId);
      await revalidateOrder(orderId);
      return { success: true as const };
    }

    // Annotated with the Prisma input type on purpose: a bare object spread
    // into `data` skips excess-property checking, which is how a stamp for a
    // column that did not exist reached runtime.
    const now = new Date();
    const stamps: Prisma.OrderUpdateInput =
      next === "SHIPPED"
        ? { shippedAt: now }
        : next === "DELIVERED"
          ? { deliveredAt: now }
          : next === "COMPLETED"
            ? { completedAt: now }
            : next === "CANCELLED"
              ? { cancelledAt: now }
              : {};
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: next,
          ...stamps,
          statusHistory: {
            create: {
              oldStatus: current.status,
              newStatus: next,
              actorId: session.user.id,
              reason: offPath
                ? "Admin correction (out of sequence)"
                : "Admin fulfilment update",
              internalNote: note,
            },
          },
        },
      });
      // Cancelling frees stock immediately instead of waiting for the sweeper.
      if (next === "CANCELLED") await releaseOrderReservations(tx, orderId);
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: offPath
            ? "ORDER_STATUS_CHANGED_OUT_OF_SEQUENCE"
            : "ORDER_STATUS_CHANGED",
          entityType: "Order",
          entityId: orderId,
          before: {
            status: current.status,
            paymentStatus: current.paymentStatus,
          },
          after: { status: next, note },
          ...meta,
        },
      });
    });
    await sendOrderStatusEmail(orderId, next, {
      includeTracking: next === "SHIPPED",
    });
    await revalidateOrder(orderId);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function decideWholesaleAction(formData: FormData) {
  const session = await requireAdmin("wholesale");
  try {
    const input = wholesaleDecisionSchema.parse(values(formData));
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      const application = await tx.wholesaleApplication.findUniqueOrThrow({
        where: { id: input.applicationId },
      });
      assertWholesaleTransition(
        application.status as WholesaleState,
        input.status,
      );
      await tx.wholesaleApplication.update({
        where: { id: input.applicationId },
        data: {
          status: input.status,
          internalNotes: input.internalNotes || null,
          reviewedAt: new Date(),
        },
      });
      if (input.status === "APPROVED" && application.userId) {
        await tx.user.update({
          where: { id: application.userId },
          data: { role: "WHOLESALE_CUSTOMER" },
        });
        await tx.wholesaleAccount.upsert({
          where: { userId: application.userId },
          create: {
            userId: application.userId,
            companyName: application.companyName,
            approvedAt: new Date(),
            minimumOrderCents: input.minimumOrderCents,
            invoicePaymentEligible: input.invoicePaymentEligible,
          },
          update: {
            companyName: application.companyName,
            approvedAt: new Date(),
            minimumOrderCents: input.minimumOrderCents,
            invoicePaymentEligible: input.invoicePaymentEligible,
          },
        });
      }
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: `WHOLESALE_${input.status}`,
          entityType: "WholesaleApplication",
          entityId: application.id,
          before: { status: application.status },
          after: { status: input.status },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/wholesale");
    revalidatePath(`/admin/wholesale/${input.applicationId}`);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function createCouponAction(formData: FormData) {
  const session = await requireAdmin("coupons");
  try {
    const input = couponAdminSchema.parse(values(formData));
    const meta = await requestMeta();
    const coupon = await db.coupon.create({
      data: {
        code: input.code,
        type: input.type,
        value: input.value,
        active: input.active,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        minimumOrderCents: input.minimumOrderCents,
        usageLimit: input.usageLimit,
        perCustomerLimit: input.perCustomerLimit,
      },
    });
    await db.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "COUPON_CREATED",
        entityType: "Coupon",
        entityId: coupon.id,
        after: { code: coupon.code, type: coupon.type, value: coupon.value },
        ...meta,
      },
    });
    revalidatePath("/admin/coupons");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateCouponAction(formData: FormData) {
  const session = await requireAdmin("coupons");
  try {
    const id = z.string().min(1).parse(formData.get("couponId"));
    const input = couponAdminSchema.parse(values(formData));
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      await tx.coupon.update({
        where: { id },
        data: {
          code: input.code,
          type: input.type,
          value: input.value,
          active: input.active,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          minimumOrderCents: input.minimumOrderCents,
          usageLimit: input.usageLimit,
          perCustomerLimit: input.perCustomerLimit,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "COUPON_UPDATED",
          entityType: "Coupon",
          entityId: id,
          after: { code: input.code, active: input.active },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/coupons");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteCouponAction(formData: FormData) {
  const session = await requireAdmin("coupons");
  try {
    const id = z.string().min(1).parse(formData.get("couponId"));
    // A redeemed coupon is part of the order record; disable it instead of
    // deleting so historical usage and totals stay intact.
    const usages = await db.couponUsage.count({ where: { couponId: id } });
    if (usages) throw new Error("COUPON_HAS_USAGES_DISABLE_INSTEAD");
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      await tx.couponCategory.deleteMany({ where: { couponId: id } });
      await tx.coupon.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "COUPON_DELETED",
          entityType: "Coupon",
          entityId: id,
          ...meta,
        },
      });
    });
    revalidatePath("/admin/coupons");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function createGiftBoxAction(formData: FormData) {
  const session = await requireAdmin("gift-boxes");
  try {
    const input = giftBoxAdminSchema.parse(values(formData));
    const meta = await requestMeta();
    const box = await db.giftBox.create({
      data: {
        internalName: input.nameEn,
        nameDe: input.nameDe,
        nameEn: input.nameEn,
        slugDe: input.slugDe,
        slugEn: input.slugEn,
        descriptionDe: input.descriptionDe,
        descriptionEn: input.descriptionEn,
        seoTitleDe: input.seoTitleDe,
        seoTitleEn: input.seoTitleEn,
        metaDescriptionDe: input.metaDescriptionDe,
        metaDescriptionEn: input.metaDescriptionEn,
        sizeName: input.sizeName,
        basePriceCents: input.basePriceCents,
        capacityUnits: input.capacityUnits,
        minItems: input.minItems,
        maxItems: input.maxItems,
        fixed: input.fixed,
        active: input.active,
        occasions: ["GENERAL"],
      },
    });
    await db.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "GIFT_BOX_CREATED",
        entityType: "GiftBox",
        entityId: box.id,
        after: { nameDe: box.nameDe, active: box.active },
        ...meta,
      },
    });
    revalidatePath("/admin/gift-boxes");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateGiftBoxAction(formData: FormData) {
  const session = await requireAdmin("gift-boxes");
  try {
    const id = z.string().min(1).parse(formData.get("giftBoxId"));
    const input = giftBoxAdminSchema.parse(values(formData));
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      await tx.giftBox.update({
        where: { id },
        data: {
          nameDe: input.nameDe,
          nameEn: input.nameEn,
          slugDe: input.slugDe,
          slugEn: input.slugEn,
          descriptionDe: input.descriptionDe,
          descriptionEn: input.descriptionEn,
          seoTitleDe: input.seoTitleDe,
          seoTitleEn: input.seoTitleEn,
          metaDescriptionDe: input.metaDescriptionDe,
          metaDescriptionEn: input.metaDescriptionEn,
          sizeName: input.sizeName,
          basePriceCents: input.basePriceCents,
          capacityUnits: input.capacityUnits,
          minItems: input.minItems,
          maxItems: input.maxItems,
          fixed: input.fixed,
          active: input.active,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "GIFT_BOX_UPDATED",
          entityType: "GiftBox",
          entityId: id,
          after: { nameDe: input.nameDe, active: input.active },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/gift-boxes");
    revalidatePath(`/admin/gift-boxes/${id}`);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteGiftBoxAction(formData: FormData) {
  const session = await requireAdmin("gift-boxes");
  try {
    const id = z.string().min(1).parse(formData.get("giftBoxId"));
    const configurations = await db.giftBoxConfiguration.count({
      where: { giftBoxId: id },
    });
    if (configurations)
      throw new Error("GIFT_BOX_HAS_CONFIGURATIONS_DEACTIVATE_INSTEAD");
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      await tx.giftBoxItem.deleteMany({ where: { giftBoxId: id } });
      await tx.giftBox.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "GIFT_BOX_DELETED",
          entityType: "GiftBox",
          entityId: id,
          ...meta,
        },
      });
    });
    revalidatePath("/admin/gift-boxes");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function addGiftBoxItemAction(formData: FormData) {
  const session = await requireAdmin("gift-boxes");
  try {
    const input = z
      .object({
        giftBoxId: z.string().min(1),
        variantId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(50),
        units: z.coerce.number().int().min(1).max(50).default(1),
      })
      .parse(values(formData));
    const variant = await db.productVariant.findUnique({
      where: { id: input.variantId },
      select: { productId: true },
    });
    if (!variant) throw new Error("VARIANT_NOT_FOUND");
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      await tx.giftBoxItem.upsert({
        where: {
          giftBoxId_variantId: {
            giftBoxId: input.giftBoxId,
            variantId: input.variantId,
          },
        },
        update: { quantity: input.quantity, units: input.units },
        create: {
          giftBoxId: input.giftBoxId,
          productId: variant.productId,
          variantId: input.variantId,
          quantity: input.quantity,
          units: input.units,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "GIFT_BOX_ITEM_ADDED",
          entityType: "GiftBox",
          entityId: input.giftBoxId,
          after: { variantId: input.variantId, quantity: input.quantity },
          ...meta,
        },
      });
    });
    revalidatePath(`/admin/gift-boxes/${input.giftBoxId}`);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeGiftBoxItemAction(formData: FormData) {
  const session = await requireAdmin("gift-boxes");
  try {
    const input = z
      .object({
        giftBoxId: z.string().min(1),
        variantId: z.string().min(1),
      })
      .parse(values(formData));
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      await tx.giftBoxItem.delete({
        where: {
          giftBoxId_variantId: {
            giftBoxId: input.giftBoxId,
            variantId: input.variantId,
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "GIFT_BOX_ITEM_REMOVED",
          entityType: "GiftBox",
          entityId: input.giftBoxId,
          after: { variantId: input.variantId },
          ...meta,
        },
      });
    });
    revalidatePath(`/admin/gift-boxes/${input.giftBoxId}`);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function addTrackingAction(formData: FormData) {
  const session = await requireAdmin("orders");
  try {
    const orderId = z.string().min(1).parse(formData.get("orderId"));
    const trackingNumber = z
      .string()
      .trim()
      .min(3)
      .max(120)
      .parse(formData.get("trackingNumber"));
    // Must reject javascript:/data: — this value is rendered as an href in the
    // admin and mailed to the customer as a link.
    const trackingUrl = z
      .string()
      .url()
      .refine((value) => isSafeUrl(value), {
        message: "Tracking URL must be an https link.",
      })
      .optional()
      .parse(formData.get("trackingUrl") || undefined);
    const provider = z
      .string()
      .trim()
      .min(2)
      .max(50)
      .parse(formData.get("provider"));
    const meta = await requestMeta();
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    // Handing a parcel to the carrier IS shipping the order. Recording the
    // shipment and moving the status used to be two separate forms, so an
    // order could sit "packed" with tracking already issued, or be marked
    // shipped with nothing for the customer to track.
    const shipped =
      order.status !== "SHIPPED" &&
      (
        orderTransitions[order.status as DomainOrderStatus] as readonly string[]
      ).includes("SHIPPED");

    await db.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          orderId,
          provider,
          trackingNumber,
          trackingUrl,
          status: "LABEL_CREATED",
        },
      });
      if (shipped)
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "SHIPPED",
            statusHistory: {
              create: {
                oldStatus: order.status,
                newStatus: "SHIPPED",
                actorId: session.user.id,
                reason: `Shipment recorded · ${provider} ${trackingNumber}`,
              },
            },
          },
        });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "SHIPMENT_TRACKING_ADDED",
          entityType: "Shipment",
          entityId: shipment.id,
          before: { status: order.status },
          after: {
            provider,
            trackingNumber,
            status: shipped ? "SHIPPED" : order.status,
          },
          ...meta,
        },
      });
    });
    if (shipped)
      await sendOrderStatusEmail(orderId, "SHIPPED", { includeTracking: true });
    await revalidateOrder(orderId);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function refundOrderAction(formData: FormData) {
  const session = await requireAdmin("orders", { recent: true });
  try {
    const orderId = z.string().min(1).parse(formData.get("orderId"));
    const amountCents = z.coerce
      .number()
      .int()
      .positive()
      .parse(formData.get("amountCents"));
    const reason = z
      .string()
      .trim()
      .min(3)
      .max(500)
      .parse(formData.get("reason"));
    const meta = await requestMeta();

    // The service locks the payment row, revalidates the refundable amount
    // inside that lock, calls Stripe, then records the refund — so two
    // administrators refunding at once cannot both pass validation.
    const result = await issueRefund({
      orderId,
      amountCents,
      reason,
      actorId: session.user.id,
    });

    await db.auditLog.create({
      data: {
        actorId: session.user.id,
        action: result.full ? "FULL_REFUND_CREATED" : "PARTIAL_REFUND_CREATED",
        entityType: "Order",
        entityId: orderId,
        after: {
          amountCents,
          stripeRefundId: result.stripeRefundId,
          totalRefunded: result.refunded,
          reason,
        },
        ...meta,
      },
    });
    await sendOrderStatusEmail(orderId, "REFUNDED");
    await revalidateOrder(orderId);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateCustomerNotesAction(formData: FormData) {
  const session = await requireAdmin("customers");
  try {
    const userId = z.string().min(1).parse(formData.get("userId"));
    const internalNotes = z
      .string()
      .trim()
      .max(5_000)
      .parse(formData.get("internalNotes") ?? "");
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      await tx.customerProfile.upsert({
        where: { userId },
        create: { userId, internalNotes },
        update: { internalNotes },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "CUSTOMER_NOTES_UPDATED",
          entityType: "User",
          entityId: userId,
          after: { notesUpdated: true },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/customers");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function requestCustomerAnonymisationAction(formData: FormData) {
  const session = await requireAdmin("customers");
  try {
    const userId = z.string().min(1).parse(formData.get("userId"));
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { deletionRequestedAt: new Date(), disabled: true },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "CUSTOMER_DELETION_REQUESTED",
          entityType: "User",
          entityId: userId,
          after: { disabled: true, deletionRequested: true },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/customers");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateUserRoleAction(formData: FormData) {
  const session = await requireAdmin("settings", { recent: true });
  try {
    if (String(session.user.role) !== "SUPER_ADMIN")
      throw new Error("SUPER_ADMIN_REQUIRED");
    const userId = z.string().min(1).parse(formData.get("userId"));
    const role = z
      .enum([
        "CUSTOMER",
        "WHOLESALE_CUSTOMER",
        "CONTENT_EDITOR",
        "ORDER_MANAGER",
        "ADMIN",
        "SUPER_ADMIN",
      ])
      .parse(formData.get("role"));
    const meta = await requestMeta();
    const before = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { role: true },
    });
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { role } });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "USER_ROLE_CHANGED",
          entityType: "User",
          entityId: userId,
          before: { role: before.role },
          after: { role },
          ...meta,
        },
      });
    });
    revalidatePath(`/admin/customers/${userId}`);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function moderateReviewAction(formData: FormData) {
  const session = await requireAdmin("reviews");
  try {
    const reviewId = z.string().min(1).parse(formData.get("reviewId"));
    const status = z
      .enum(["APPROVED", "REJECTED", "SPAM"])
      .parse(formData.get("status"));
    const meta = await requestMeta();
    const before = await db.review.findUniqueOrThrow({
      where: { id: reviewId },
    });
    await db.$transaction(async (tx) => {
      await tx.review.update({ where: { id: reviewId }, data: { status } });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "REVIEW_MODERATED",
          entityType: "Review",
          entityId: reviewId,
          before: { status: before.status },
          after: { status },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/reviews");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateLegalDocumentAction(formData: FormData) {
  const session = await requireAdmin("content", { recent: true });
  try {
    const id = z.string().min(1).parse(formData.get("documentId"));
    const title = z
      .string()
      .trim()
      .min(2)
      .max(200)
      .parse(formData.get("title"));
    const content = z
      .string()
      .trim()
      .max(50_000)
      .parse(formData.get("content"));
    const complete = formData.get("complete") === "true";
    const meta = await requestMeta();
    const before = await db.legalDocument.findUniqueOrThrow({ where: { id } });
    await db.$transaction(async (tx) => {
      await tx.legalDocument.update({
        where: { id },
        data: {
          title,
          contentJson: { type: "plainText", text: content },
          complete,
          approvedAt: complete ? new Date() : null,
          approvedBy: complete ? session.user.id : null,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "LEGAL_CONTENT_UPDATED",
          entityType: "LegalDocument",
          entityId: id,
          before: { complete: before.complete, version: before.version },
          after: { complete, title },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/content");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

const editableSettings = new Set([
  "business.tradingName",
  "business.registeredName",
  "business.owner",
  "business.address",
  "business.phone",
  "business.whatsapp",
  "business.email",
  "business.registrationNumber",
  "business.vatId",
  "business.taxNumber",
  "business.lucidNumber",
  "business.foodBusinessRegistration",
  "commerce.currency",
  "commerce.vatMode",
  "commerce.minimumOrderCents",
  "commerce.freeShippingThresholdCents",
  "commerce.stockReservationMinutes",
  "shipping.dispatchEstimate",
  "shipping.deliveryEstimate",
  "brand.socialHandle",
  "brand.instagramUrl",
  "brand.facebookUrl",
  "brand.tiktokUrl",
  "brand.youtubeUrl",
  "brand.pinterestUrl",
  "brand.linkedinUrl",
  "brand.xUrl",
  "compliance.cookieConsentVersion",
]);

export async function updateSettingAction(formData: FormData) {
  const session = await requireAdmin("settings", { recent: true });
  try {
    const key = z.string().parse(formData.get("key"));
    if (!editableSettings.has(key)) throw new Error("SETTING_NOT_EDITABLE");
    const value = z
      .string()
      .max(5_000)
      .parse(formData.get("value") ?? "");
    const meta = await requestMeta();
    const before = await db.siteSetting.findUnique({ where: { key } });
    await db.$transaction(async (tx) => {
      await tx.siteSetting.upsert({
        where: { key },
        create: {
          key,
          value,
          type: "STRING",
          group: key.split(".")[0],
          updatedBy: session.user.id,
        },
        update: { value, updatedBy: session.user.id },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "SETTING_UPDATED",
          entityType: "SiteSetting",
          entityId: key,
          before: before ? { value: before.value } : undefined,
          after: { configured: Boolean(value) },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/settings");
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateContactEnquiryAction(formData: FormData) {
  const session = await requireAdmin("contact-enquiries");
  try {
    const input = z
      .object({
        enquiryId: z.string().min(1),
        status: z.enum([
          "NEW",
          "IN_PROGRESS",
          "WAITING_FOR_CUSTOMER",
          "RESOLVED",
          "SPAM",
        ]),
      })
      .parse(values(formData));
    const meta = await requestMeta();
    const before = await db.contactEnquiry.findUniqueOrThrow({
      where: { id: input.enquiryId },
      select: { status: true, resolvedAt: true },
    });
    await db.$transaction(async (tx) => {
      await tx.contactEnquiry.update({
        where: { id: input.enquiryId },
        data: {
          status: input.status,
          resolvedAt: input.status === "RESOLVED" ? new Date() : null,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "CONTACT_ENQUIRY_STATUS_CHANGED",
          entityType: "ContactEnquiry",
          entityId: input.enquiryId,
          before: { status: before.status },
          after: { status: input.status },
          ...meta,
        },
      });
    });
    revalidatePath("/admin/contact-enquiries");
    revalidatePath(`/admin/contact-enquiries/${input.enquiryId}`);
    return { success: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function upsertPackagingAction(formData: FormData) {
  const session = await requireAdmin("packaging");
  try {
    const input = z
      .object({
        packagingId: z.string().optional().default(""),
        nameDe: z.string().trim().min(2).max(160),
        nameEn: z.string().trim().min(2).max(160),
        descriptionDe: z.string().trim().max(2_000).optional().default(""),
        descriptionEn: z.string().trim().max(2_000).optional().default(""),
        priceCents: z.coerce.number().int().min(0).max(10_000_000),
        sortOrder: z.coerce.number().int().min(0).max(10_000),
      })
      .parse(values(formData));
    const active = formData.get("active") === "true";
    const {
      packagingId,
      nameDe,
      nameEn,
      descriptionDe,
      descriptionEn,
      priceCents,
      sortOrder,
    } = input;
    const data = {
      nameDe,
      nameEn,
      descriptionDe,
      descriptionEn,
      priceCents,
      sortOrder,
      active,
    };
    const meta = await requestMeta();
    const before = packagingId
      ? await db.giftPackagingOption.findUnique({
          where: { id: packagingId },
        })
      : null;
    const saved = await db.$transaction(async (tx) => {
      const option = packagingId
        ? await tx.giftPackagingOption.update({
            where: { id: packagingId },
            data,
          })
        : await tx.giftPackagingOption.create({
            data,
          });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: before ? "PACKAGING_UPDATED" : "PACKAGING_CREATED",
          entityType: "GiftPackagingOption",
          entityId: option.id,
          before: before
            ? { priceCents: before.priceCents, active: before.active }
            : undefined,
          after: { priceCents: option.priceCents, active: option.active },
          ...meta,
        },
      });
      return option;
    });
    revalidatePath("/admin/packaging");
    return { success: true as const, id: saved.id };
  } catch (error) {
    return actionError(error);
  }
}
