/**
 * Development helper: confirm an order's payment without Stripe.
 *
 * In production only the signed Stripe webhook may mark an order PAID, which
 * is why the admin status dropdown never offers PAID. Locally there is usually
 * no webhook listener, so orders sit at PENDING_PAYMENT forever and the rest of
 * the fulfilment flow (Processing, Packed, Shipped, Delivered, refunds) can
 * never be exercised.
 *
 * This calls the exact same `confirmOrderPayment` service the webhook uses, so
 * reservations convert to a real sale and inventory is decremented identically.
 * It is not a shortcut around the state machine — it is the same code path.
 *
 * Usage:
 *   npm run db:simulate-payment                  # newest unpaid order
 *   npm run db:simulate-payment KDF-2026-1ED9D160
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { confirmOrderPayment } from "../src/server/services/payment-confirmation";

if (process.env.NODE_ENV === "production")
  throw new Error("simulate-payment is disabled in production.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

async function main() {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const requested = process.argv[2];
  const order = requested
    ? await db.order.findUnique({ where: { number: requested } })
    : await db.order.findFirst({
        where: { paymentStatus: "PENDING" },
        orderBy: { createdAt: "desc" },
      });

  if (!order) {
    console.error(
      requested
        ? `Order ${requested} was not found.`
        : "No order with a pending payment was found.",
    );
    process.exitCode = 1;
    return;
  }
  if (order.paymentStatus === "PAID") {
    console.info(`${order.number} is already paid — nothing to do.`);
    return;
  }

  const changed = await confirmOrderPayment(db, order.id, {
    paymentIntentId: `pi_simulated_${order.id.slice(-12)}`,
    reference: `dev_simulated_${process.pid}`,
  });

  const updated = await db.order.findUnique({
    where: { id: order.id },
    include: {
      items: { include: { variant: { include: { inventory: true } } } },
    },
  });
  console.info(
    changed
      ? `${order.number}: ${order.status} -> ${updated?.status} (payment ${updated?.paymentStatus})`
      : `${order.number}: no change.`,
  );
  for (const item of updated?.items ?? [])
    console.info(
      `  ${item.sku}: onHand ${item.variant.inventory?.onHand} · reserved ${item.variant.inventory?.reserved}`,
    );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
