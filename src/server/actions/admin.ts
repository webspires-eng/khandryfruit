"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import Papa from "papaparse";
import { db } from "@/lib/db/client";
import {
  assertOrderTransition,
  type DomainOrderStatus,
} from "@/lib/commerce/order-state";
import {
  applyStockAdjustment,
  assertWholesaleTransition,
  validateRefund,
  type WholesaleState,
} from "@/lib/commerce/admin-rules";
import { getStripe } from "@/lib/stripe/client";
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
import { getProductReadiness } from "@/server/services/product-readiness";

function values(formData: FormData) {
  return Object.fromEntries(formData.entries());
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
      const category = await tx.category.findFirst({
        where: { id: input.categoryId, active: true },
      });
      if (!category) throw new Error("CATEGORY_NOT_FOUND");
      const translations = [
        {
          locale: "de" as const,
          name: input.nameDe,
          slug: input.slugDe,
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
        ...(input.nameEn && input.slugEn
          ? [
              {
                locale: "en" as const,
                name: input.nameEn,
                slug: input.slugEn,
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
          categories: {
            create: { categoryId: input.categoryId, isPrimary: true },
          },
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
          categories: {
            deleteMany: {},
            create: { categoryId: input.categoryId, isPrimary: true },
          },
          translations: {
            upsert: [
              {
                where: { productId_locale: { productId, locale: "de" } },
                create: {
                  locale: "de",
                  name: input.nameDe,
                  slug: input.slugDe,
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
                  slug: input.slugDe,
                  shortDescription: input.shortDescriptionDe,
                  description: input.descriptionDe,
                  ingredients: input.ingredientsDe,
                  allergenStatement: input.allergenDe,
                  storageInstructions: input.storageDe,
                  seoTitle: input.seoTitleDe,
                  metaDescription: input.metaDescriptionDe,
                },
              },
              ...(input.nameEn && input.slugEn
                ? [
                    {
                      where: {
                        productId_locale: { productId, locale: "en" as const },
                      },
                      create: {
                        locale: "en" as const,
                        name: input.nameEn,
                        slug: input.slugEn,
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
                        slug: input.slugEn,
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
    const next = z
      .enum([
        "PROCESSING",
        "PACKED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURN_REQUESTED",
      ])
      .parse(formData.get("status"));
    const note = z
      .string()
      .max(1_000)
      .optional()
      .parse(formData.get("note") || undefined);
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
      });
      assertOrderTransition(order.status as DomainOrderStatus, next);
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: next,
          statusHistory: {
            create: {
              oldStatus: order.status,
              newStatus: next,
              actorId: session.user.id,
              reason: "Admin fulfilment update",
              internalNote: note,
            },
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "ORDER_STATUS_CHANGED",
          entityType: "Order",
          entityId: orderId,
          before: { status: order.status },
          after: { status: next, note },
          ...meta,
        },
      });
    });
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
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
    const trackingUrl = z
      .string()
      .url()
      .optional()
      .parse(formData.get("trackingUrl") || undefined);
    const provider = z
      .string()
      .trim()
      .min(2)
      .max(50)
      .parse(formData.get("provider"));
    const meta = await requestMeta();
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
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "SHIPMENT_TRACKING_ADDED",
          entityType: "Shipment",
          entityId: shipment.id,
          after: { provider, trackingNumber },
          ...meta,
        },
      });
    });
    revalidatePath(`/admin/orders/${orderId}`);
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
    const payment = await db.payment.findFirst({
      where: {
        orderId,
        status: { in: ["PAID", "PARTIALLY_REFUNDED"] },
        providerPaymentId: { not: null },
      },
      include: { refunds: true },
    });
    if (!payment?.providerPaymentId)
      throw new Error("REFUNDABLE_PAYMENT_NOT_FOUND");
    const refunded = payment.refunds.reduce(
      (sum, item) => sum + item.amountCents,
      0,
    );
    validateRefund(amountCents, payment.amountCents, refunded);
    const stripeRefund = await getStripe().refunds.create(
      {
        payment_intent: payment.providerPaymentId,
        amount: amountCents,
        metadata: { orderId, actorId: session.user.id },
      },
      {
        idempotencyKey: `admin-refund-${payment.id}-${refunded}-${amountCents}`,
      },
    );
    const full = refunded + amountCents === payment.amountCents;
    const meta = await requestMeta();
    await db.$transaction(async (tx) => {
      await tx.refund.create({
        data: {
          paymentId: payment.id,
          providerRefundId: stripeRefund.id,
          amountCents,
          reason,
        },
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: full ? "REFUNDED" : "PARTIALLY_REFUNDED" },
      });
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: full ? "REFUNDED" : "PARTIALLY_REFUNDED",
          paymentStatus: full ? "REFUNDED" : "PARTIALLY_REFUNDED",
          statusHistory: {
            create: {
              oldStatus: order.status,
              newStatus: full ? "REFUNDED" : "PARTIALLY_REFUNDED",
              actorId: session.user.id,
              reason,
            },
          },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: full ? "FULL_REFUND_CREATED" : "PARTIAL_REFUND_CREATED",
          entityType: "Order",
          entityId: orderId,
          after: { amountCents, stripeRefundId: stripeRefund.id, reason },
          ...meta,
        },
      });
    });
    revalidatePath(`/admin/orders/${orderId}`);
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
