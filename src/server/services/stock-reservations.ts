import type { PrismaClient } from "@generated/prisma/client";

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Returns an order's still-held stock reservations to available inventory.
 *
 * Only reservations that are neither released nor converted are touched, so
 * the function is safe to call twice: a second call finds nothing to do rather
 * than crediting stock a second time.
 *
 * Callers own the order's status fields — this deliberately does not touch
 * them, because checkout rollback, admin cancellation and the expiry sweeper
 * each need different status outcomes.
 */
export async function releaseOrderReservations(tx: TxClient, orderId: string) {
  const reservations = await tx.stockReservation.findMany({
    where: { orderId, releasedAt: null, convertedAt: null },
  });
  for (const reservation of reservations) {
    await tx.inventory.update({
      where: { id: reservation.inventoryId },
      data: {
        reserved: { decrement: reservation.quantity },
        version: { increment: 1 },
        adjustments: {
          create: {
            type: "RELEASE",
            quantity: -reservation.quantity,
            reason: "Order cancelled before payment",
            reference: orderId,
          },
        },
      },
    });
  }
  await tx.stockReservation.updateMany({
    where: { orderId, releasedAt: null, convertedAt: null },
    data: { releasedAt: new Date() },
  });
  return reservations.length;
}
