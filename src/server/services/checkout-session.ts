import "server-only";

import { db } from "@/lib/db/client";
import { logger } from "@/lib/logging/logger";
import { getStripe } from "@/lib/stripe/client";
import { confirmOrderPayment } from "@/server/services/payment-confirmation";
import { sendOrderConfirmationEmails } from "@/server/services/order-notifications";

/**
 * Confirms an order from the Stripe Checkout session the customer returned with.
 *
 * The signed webhook remains the primary path. This is the fallback for when it
 * has not arrived yet — or cannot arrive, as in local development where Stripe
 * has no route to localhost — so a customer who has genuinely paid does not sit
 * looking at an unpaid order.
 *
 * The session id in the return URL is never trusted. It is used only to look
 * the session up through Stripe's API, and the result is accepted only when:
 *
 *   1. Stripe reports `payment_status: "paid"`, and
 *   2. the session's own metadata names the order being viewed.
 *
 * Without (2), somebody could append a stranger's session id to their own order
 * URL and have it marked paid. Settlement runs through `confirmOrderPayment`,
 * the same idempotent service the webhook uses, so a later webhook for the same
 * payment changes nothing.
 */
export async function confirmOrderFromCheckoutSession(input: {
  orderId: string;
  sessionId: string;
}): Promise<"confirmed" | "already-paid" | "not-paid" | "mismatch" | "error"> {
  const { orderId, sessionId } = input;
  if (!sessionId.startsWith("cs_")) return "mismatch";

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.metadata?.orderId !== orderId) {
      logger.warn("checkout_session_order_mismatch", { orderId, sessionId });
      return "mismatch";
    }
    if (session.payment_status !== "paid") return "not-paid";

    const confirmed = await confirmOrderPayment(db, orderId, {
      paymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id,
      reference: `return_url_${sessionId}`,
    });
    if (!confirmed) return "already-paid";

    logger.info("payment_confirmed_from_return_url", { orderId, sessionId });
    await sendOrderConfirmationEmails(orderId);
    return "confirmed";
  } catch (error) {
    // Never break the confirmation page because Stripe was unreachable; the
    // webhook or a later page load will still settle the order.
    logger.error("checkout_session_confirmation_failed", {
      orderId,
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return "error";
  }
}
