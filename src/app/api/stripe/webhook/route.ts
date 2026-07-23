import { createHash, randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { db } from "@/lib/db/client";
import { env, stripeWebhookReady } from "@/lib/env";
import { logger } from "@/lib/logging/logger";
import { getStripe } from "@/lib/stripe/client";
import { confirmOrderPayment } from "@/server/services/payment-confirmation";
import { sendOrderConfirmationEmails } from "@/server/services/order-notifications";
import { syncRefundsFromStripe } from "@/server/services/refunds";

export async function POST(request: Request) {
  const correlationId = randomUUID();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  if (!signature || !env.STRIPE_WEBHOOK_SECRET)
    return Response.json(
      { error: "Webhook configuration missing" },
      { status: 400 },
    );
  // A placeholder secret rejects every delivery with an opaque signature error,
  // leaving orders stuck unpaid with nothing in the log explaining why.
  if (!stripeWebhookReady()) {
    logger.error("stripe_webhook_secret_invalid", {
      correlationId,
      hint: "STRIPE_WEBHOOK_SECRET is a placeholder. Run `stripe listen --forward-to localhost:3001/api/stripe/webhook` and copy the whsec_ value it prints.",
    });
    return Response.json(
      { error: "Webhook secret is not configured" },
      { status: 500 },
    );
  }
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    logger.warn("stripe_webhook_rejected", { correlationId });
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }
  logger.info("stripe_webhook_received", {
    correlationId,
    stripeEventId: event.id,
    eventType: event.type,
  });
  const existing = await db.stripeEvent.findUnique({ where: { id: event.id } });
  if (existing?.processedAt)
    return Response.json({ received: true, duplicate: true });
  await db.stripeEvent.upsert({
    where: { id: event.id },
    create: {
      id: event.id,
      type: event.type,
      livemode: event.livemode,
      payloadHash: createHash("sha256").update(body).digest("hex"),
      attempts: 1,
    },
    update: { attempts: { increment: 1 } },
  });
  try {
    if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
      ].includes(event.type)
    )
      await confirmCheckout(
        event.data.object as Stripe.Checkout.Session,
        event.id,
      );
    else if (event.type === "checkout.session.async_payment_failed")
      await failCheckout(event.data.object as Stripe.Checkout.Session);
    else if (event.type === "payment_intent.payment_failed")
      await failPayment(event.data.object as Stripe.PaymentIntent);
    else if (event.type === "charge.refunded")
      await recordRefund(event.data.object as Stripe.Charge);
    await db.stripeEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date(), error: null },
    });
    return Response.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.slice(0, 500)
        : "Unknown processing error";
    await db.stripeEvent.update({
      where: { id: event.id },
      data: { error: message },
    });
    logger.error("stripe_webhook_failed", {
      correlationId,
      stripeEventId: event.id,
    });
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }
}

async function confirmCheckout(
  session: Stripe.Checkout.Session,
  eventId: string,
) {
  const orderId = session.metadata?.orderId;
  if (!orderId || session.payment_status !== "paid") return;
  const confirmed = await confirmOrderPayment(db, orderId, {
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id,
    reference: eventId,
  });
  // Only notify on the transition itself, never on a redelivered event.
  // The key must match the order status the settlement writes — CONFIRMED.
  if (confirmed) await sendOrderConfirmationEmails(orderId);
  logger.info("checkout_confirmed", { orderId, stripeEventId: eventId });
}
async function failCheckout(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  await db.order.update({
    where: { id: orderId },
    data: {
      // The order stays PENDING and unpaid so the customer can retry; the
      // failure itself is recorded on the Payment row.
      paymentStatus: "UNPAID",
      payments: {
        updateMany: {
          where: { status: { in: ["PENDING", "PROCESSING"] } },
          data: { status: "FAILED" },
        },
      },
    },
  });
}
async function failPayment(intent: Stripe.PaymentIntent) {
  const orderId = intent.metadata.orderId;
  if (!orderId) return;
  await db.payment.updateMany({
    where: { orderId },
    data: {
      status: "FAILED",
      failureCode: intent.last_payment_error?.code,
      failureMessage: intent.last_payment_error?.message?.slice(0, 300),
    },
  });
}
/**
 * Reconciles refunds from Stripe.
 *
 * Previously this updated order status but created no Refund row, so a refund
 * that failed to record locally left the refundable total unchanged and the
 * same money could be refunded twice. Syncing the actual refund list makes this
 * the recovery path for that case, and the record path for refunds issued
 * straight from the Stripe dashboard.
 */
async function recordRefund(charge: Stripe.Charge) {
  const paymentIntent =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntent || charge.amount_refunded <= 0) return;
  await syncRefundsFromStripe(paymentIntent);
}
