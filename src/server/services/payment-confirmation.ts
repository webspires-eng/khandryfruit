import type { PrismaClient } from "@generated/prisma/client";

import { logger } from "@/lib/logging/logger";

/**
 * Marks an order paid and converts its stock reservations into a real sale.
 *
 * This is the single place allowed to move an order into PAID, which is why
 * `transitionOrderAction` deliberately excludes PAID from the statuses an
 * administrator may choose. The Stripe webhook is the production caller; the
 * development simulator calls the same function so local runs exercise the
 * identical code path rather than a parallel approximation.
 *
 * The Prisma client is injected rather than imported so that the module stays
 * usable from maintenance scripts, which run outside the server-only boundary.
 *
 * Idempotent: an order already marked PAID returns `false` and changes nothing,
 * so redelivered webhooks cannot double-decrement inventory.
 */
export async function confirmOrderPayment(
  client: PrismaClient,
  orderId: string,
  options: { paymentIntentId?: string; reference: string },
): Promise<boolean> {
  const changed = await client.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { reservations: true },
    });
    if (!order || order.paymentStatus === "PAID") return false;

    for (const reservation of order.reservations.filter(
      (item) => !item.convertedAt && !item.releasedAt,
    )) {
      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          onHand: { decrement: reservation.quantity },
          reserved: { decrement: reservation.quantity },
          version: { increment: 1 },
          adjustments: {
            create: {
              type: "SALE",
              quantity: -reservation.quantity,
              reason: "Verified Stripe payment",
              reference: options.reference,
            },
          },
        },
      });
      await tx.stockReservation.update({
        where: { id: reservation.id },
        data: { convertedAt: new Date() },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        // Money arriving confirms the order; it does not move the goods.
        status: "CONFIRMED",
        paymentStatus: "PAID",
        paidAt: new Date(),
        payments: {
          updateMany: {
            where: { status: { in: ["PENDING", "PROCESSING"] } },
            data: {
              status: "PAID",
              providerPaymentId: options.paymentIntentId,
              paidAt: new Date(),
            },
          },
        },
        statusHistory: {
          create: {
            oldStatus: order.status,
            newStatus: "CONFIRMED",
            reason: "Stripe payment verified",
          },
        },
      },
    });
    return true;
  });

  if (changed) logger.info("payment_confirmed", { orderId });
  return changed;
}
