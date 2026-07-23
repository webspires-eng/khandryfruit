import "server-only";

import { validateRefund } from "@/lib/commerce/admin-rules";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/logging/logger";
import { getStripe } from "@/lib/stripe/client";

/** Stripe calls are fast, but the payment row stays locked until they return. */
const REFUND_TRANSACTION_TIMEOUT_MS = 20_000;

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

/**
 * Recomputes payment and order status from the refund rows that actually exist.
 *
 * Deriving rather than assigning is what keeps `Payment.status`,
 * `Order.paymentStatus` and `Order.status` from drifting apart: there is one
 * source of truth (the sum of Refund rows) and three readers of it.
 */
async function applyRefundTotals(tx: TxClient, paymentId: string) {
  const payment = await tx.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: { refunds: true },
  });
  const refunded = payment.refunds.reduce(
    (sum, refund) => sum + refund.amountCents,
    0,
  );
  if (refunded <= 0) return { refunded, full: false };
  const full = refunded >= payment.amountCents;

  // The Payment row keeps the fine-grained gateway state…
  await tx.payment.update({
    where: { id: paymentId },
    data: { status: full ? "REFUNDED" : "PARTIALLY_REFUNDED" },
  });
  // …while the order records only that money went back. Fulfilment status is
  // deliberately untouched: refunding a delivered order does not un-deliver it.
  await tx.order.update({
    where: { id: payment.orderId },
    data: { paymentStatus: "REFUNDED" },
  });
  return { refunded, full };
}

/**
 * Issues a Stripe refund and records it, with the payment row locked for the
 * whole operation.
 *
 * The lock is taken before the refundable amount is computed and held across
 * the Stripe call, so two administrators refunding at the same moment cannot
 * both pass validation — the second waits, then re-reads a total that already
 * includes the first refund.
 *
 * If Stripe fails, the transaction rolls back and nothing is recorded. If the
 * database fails after Stripe succeeded, the refund exists at Stripe with no
 * local row; `syncRefundsFromStripe` (driven by the `charge.refunded` webhook)
 * reconciles that case.
 */
export async function issueRefund(input: {
  orderId: string;
  amountCents: number;
  reason: string;
  actorId: string;
}) {
  return db.$transaction(
    async (tx) => {
      // FOR UPDATE serialises concurrent refunds on the same payment.
      const locked = await tx.$queryRaw<
        { id: string; providerPaymentId: string | null; amountCents: number }[]
      >`SELECT p."id", p."providerPaymentId", p."amountCents"
          FROM "Payment" p
         WHERE p."orderId" = ${input.orderId}
           AND p."status" IN ('PAID', 'PARTIALLY_REFUNDED')
           AND p."providerPaymentId" IS NOT NULL
         ORDER BY p."createdAt" DESC
         LIMIT 1
           FOR UPDATE`;
      const payment = locked[0];
      if (!payment?.providerPaymentId)
        throw new Error("REFUNDABLE_PAYMENT_NOT_FOUND");

      // Recomputed inside the lock — never trusted from a caller or a prior read.
      const existing = await tx.refund.findMany({
        where: { paymentId: payment.id },
        select: { amountCents: true },
      });
      const alreadyRefunded = existing.reduce(
        (sum, refund) => sum + refund.amountCents,
        0,
      );
      validateRefund(input.amountCents, payment.amountCents, alreadyRefunded);

      const stripeRefund = await getStripe().refunds.create(
        {
          payment_intent: payment.providerPaymentId,
          amount: input.amountCents,
          metadata: { orderId: input.orderId, actorId: input.actorId },
        },
        {
          idempotencyKey: `refund-${payment.id}-${alreadyRefunded}-${input.amountCents}`,
        },
      );

      await tx.refund.create({
        data: {
          paymentId: payment.id,
          providerRefundId: stripeRefund.id,
          amountCents: input.amountCents,
          reason: input.reason,
        },
      });
      const totals = await applyRefundTotals(tx, payment.id);
      // No OrderStatusHistory row: that table tracks fulfilment, and a refund
      // does not move the goods. The audit log records who refunded what.
      return { ...totals, stripeRefundId: stripeRefund.id };
    },
    { timeout: REFUND_TRANSACTION_TIMEOUT_MS },
  );
}

/**
 * Reconciles local refund rows against Stripe for one payment intent.
 *
 * Called by the `charge.refunded` webhook. Upserting on the unique
 * `providerRefundId` makes it idempotent, so it both recovers refunds that
 * failed to record locally and does nothing on redelivery. It is also the only
 * path that records refunds issued directly from the Stripe dashboard.
 */
export async function syncRefundsFromStripe(paymentIntentId: string) {
  const payment = await db.payment.findUnique({
    where: { providerPaymentId: paymentIntentId },
  });
  if (!payment) return { recorded: 0 };

  const stripeRefunds = await getStripe().refunds.list({
    payment_intent: paymentIntentId,
    limit: 100,
  });

  let recorded = 0;
  await db.$transaction(async (tx) => {
    for (const refund of stripeRefunds.data) {
      if (refund.status === "failed" || refund.status === "canceled") continue;
      const existing = await tx.refund.findUnique({
        where: { providerRefundId: refund.id },
      });
      if (existing) continue;
      await tx.refund.create({
        data: {
          paymentId: payment.id,
          providerRefundId: refund.id,
          amountCents: refund.amount,
          reason: refund.reason ?? "Recorded from Stripe",
        },
      });
      recorded += 1;
    }
    await applyRefundTotals(tx, payment.id);
  });

  if (recorded)
    logger.info("refunds_reconciled_from_stripe", {
      paymentIntentId,
      recorded,
    });
  return { recorded };
}
