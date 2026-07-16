import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { checkoutSchema, type ActionResult } from "@/lib/validation/schemas";
import { calculateCart, CommerceError } from "@/server/services/checkout";
import {
  loadGiftBoxCheckoutLines,
  markConfigurationsOrdered,
} from "@/server/services/gift-box";
import { getStripe } from "@/lib/stripe/client";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { logger } from "@/lib/logging/logger";

export async function POST(request: Request) {
  const correlationId = randomUUID();
  try {
    if (
      !env.DATABASE_URL ||
      process.env.E2E_USE_DEVELOPMENT_CATALOGUE === "1" ||
      (env.NODE_ENV !== "production" &&
        request.headers.get("x-kdf-e2e-catalogue") === "1")
    )
      return fail(
        "DATABASE_NOT_CONFIGURED",
        "Connect Supabase before creating checkout sessions.",
        503,
      );
    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json<ActionResult<never>>(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Please review the checkout details.",
            fieldErrors: parsed.error.flatten().fieldErrors as Record<
              string,
              string[]
            >,
          },
        },
        { status: 400 },
      );
    const input = parsed.data;
    // Gift boxes are re-validated and re-priced from the database — stored
    // and client-side totals are never trusted.
    const giftBoxLines = await loadGiftBoxCheckoutLines(
      input.locale,
      input.giftBoxes,
    );
    const calculation = await calculateCart(
      input.locale,
      input.lines,
      input.countryCode,
      giftBoxLines,
    );
    // Every physical variant that ships — standard lines plus gift-box
    // contents — must be published and gets one aggregated reservation.
    const reservationNeeds = new Map<string, number>();
    for (const line of calculation.lines)
      reservationNeeds.set(
        line.variantId,
        (reservationNeeds.get(line.variantId) ?? 0) + line.quantity,
      );
    for (const box of giftBoxLines)
      for (const stock of box.stockLines)
        reservationNeeds.set(
          stock.variantId,
          (reservationNeeds.get(stock.variantId) ?? 0) + stock.quantity,
        );
    const variants = await db.productVariant.findMany({
      where: {
        id: { in: [...reservationNeeds.keys()] },
        active: true,
        product: { status: "ACTIVE", deletedAt: null },
      },
      include: { inventory: true, product: true },
    });
    if (variants.length !== reservationNeeds.size)
      return fail(
        "PRODUCT_NOT_PUBLISHED",
        "A product is not approved for sale yet.",
        409,
      );
    const reservationMinutes = 30;
    const reservationExpiresAt = new Date(
      Date.now() + reservationMinutes * 60_000,
    );
    const accessToken = randomBytes(32).toString("base64url");
    const accessTokenHash = createHash("sha256")
      .update(accessToken)
      .digest("hex");
    const orderNumber = `KDF-${new Date().getUTCFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const order = await db.$transaction(
      async (tx) => {
        const created = await tx.order.create({
          data: {
            number: orderNumber,
            email: input.email,
            locale: input.locale,
            subtotalCents: calculation.subtotalCents,
            discountCents: calculation.discountCents,
            shippingCents: calculation.shippingCents,
            taxCents: calculation.taxCents,
            totalCents: calculation.totalCents,
            reservationExpiresAt,
            accessTokenHash,
            accessTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60_000),
            items: {
              create: calculation.lines.map((line) => ({
                productId: line.productId,
                variantId: line.variantId,
                productName: line.name,
                sku: line.sku,
                weightGrams: line.weightGrams,
                quantity: line.quantity,
                unitPriceCents: line.unitPriceCents,
                vatRateBps:
                  variants.find((v) => v.id === line.variantId)?.vatRateBps ??
                  0,
                taxCents: line.taxCents,
                lineTotalCents: line.lineTotalCents,
              })),
            },
            payments: { create: { amountCents: calculation.totalCents } },
            statusHistory: {
              create: {
                newStatus: "PENDING_PAYMENT",
                reason: "Checkout created",
              },
            },
            giftBoxOrderItems: {
              create: giftBoxLines.map((box) => ({
                configurationId: box.configurationId,
                giftBoxName: box.name,
                sizeName: box.sizeName,
                packagingName: box.packagingName,
                giftMessage: box.giftMessage,
                occasion: box.occasion,
                quantity: box.quantity,
                unitPriceCents: box.unitPriceCents,
                totalCents: box.unitPriceCents * box.quantity,
                snapshot: box.snapshot,
              })),
            },
          },
        });
        for (const [variantId, quantity] of reservationNeeds) {
          const variant = variants.find((item) => item.id === variantId);
          if (!variant?.inventory)
            throw new CommerceError(
              "INVENTORY_MISSING",
              "Inventory is not configured.",
            );
          const reserved = await tx.inventory.updateMany({
            where: {
              id: variant.inventory.id,
              version: variant.inventory.version,
              onHand: { gte: variant.inventory.reserved + quantity },
            },
            data: {
              reserved: { increment: quantity },
              version: { increment: 1 },
            },
          });
          if (reserved.count !== 1)
            throw new CommerceError(
              "STOCK_CHANGED",
              "Stock changed while checkout was created.",
            );
          await tx.stockReservation.create({
            data: {
              inventoryId: variant.inventory.id,
              orderId: created.id,
              quantity,
              expiresAt: reservationExpiresAt,
            },
          });
        }
        return created;
      },
      { isolationLevel: "Serializable" },
    );
    try {
      const session = await getStripe().checkout.sessions.create(
        {
          mode: "payment",
          customer_email: input.email,
          billing_address_collection: "required",
          shipping_address_collection: { allowed_countries: ["DE"] },
          line_items: [
            ...calculation.lines.map((line) => ({
              quantity: line.quantity,
              price_data: {
                currency: "eur",
                unit_amount: line.unitPriceCents,
                product_data: {
                  name: line.name,
                  metadata: {
                    productId: line.productId,
                    variantId: line.variantId,
                    sku: line.sku,
                  },
                },
              },
            })),
            ...giftBoxLines.map((box) => ({
              quantity: box.quantity,
              price_data: {
                currency: "eur",
                unit_amount: box.unitPriceCents,
                product_data: {
                  name: `${box.name} (${box.sizeName})`,
                  metadata: {
                    giftBoxConfigurationId: box.configurationId,
                  },
                },
              },
            })),
          ],
          metadata: {
            orderId: order.id,
            orderNumber: order.number,
            correlationId,
          },
          success_url: `${env.NEXT_PUBLIC_SITE_URL}/${input.locale}/order/success?order=${order.number}&access=${accessToken}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${env.NEXT_PUBLIC_SITE_URL}/${input.locale}/order/cancelled?order=${order.number}`,
          expires_at: Math.floor(reservationExpiresAt.getTime() / 1000),
          payment_intent_data: {
            metadata: {
              orderId: order.id,
              orderNumber: order.number,
              correlationId,
            },
          },
        },
        { idempotencyKey: `checkout_${order.id}` },
      );
      if (!session.url) throw new Error("STRIPE_SESSION_URL_MISSING");
      await db.order.update({
        where: { id: order.id },
        data: { stripeCheckoutId: session.id },
      });
      await markConfigurationsOrdered(
        giftBoxLines.map((box) => box.configurationId),
      );
      logger.info("checkout_session_created", {
        correlationId,
        orderId: order.id,
        stripeSessionId: session.id,
      });
      return NextResponse.json<ActionResult<{ url: string }>>({
        success: true,
        data: { url: session.url },
      });
    } catch (stripeError) {
      await releaseOrderReservations(order.id);
      logger.error("checkout_session_failed", {
        correlationId,
        orderId: order.id,
      });
      throw stripeError;
    }
  } catch (error) {
    if (error instanceof CommerceError)
      return fail(error.code, error.message, 409);
    logger.error("checkout_failed", {
      correlationId,
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return fail(
      "CHECKOUT_FAILED",
      "Checkout could not be created. Please try again.",
      500,
    );
  }
}

async function releaseOrderReservations(orderId: string) {
  await db.$transaction(async (tx) => {
    const reservations = await tx.stockReservation.findMany({
      where: { orderId, releasedAt: null, convertedAt: null },
    });
    for (const reservation of reservations) {
      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          reserved: { decrement: reservation.quantity },
          version: { increment: 1 },
        },
      });
    }
    await tx.stockReservation.updateMany({
      where: { orderId, releasedAt: null, convertedAt: null },
      data: { releasedAt: new Date() },
    });
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        paymentStatus: "CANCELLED",
        cancelledAt: new Date(),
      },
    });
  });
}
function fail(code: string, message: string, status: number) {
  return NextResponse.json<ActionResult<never>>(
    { success: false, error: { code, message } },
    { status },
  );
}
