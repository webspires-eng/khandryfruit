import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { db } from "@/lib/db/client";

/**
 * Loads an order for the customer-facing confirmation page.
 *
 * Guest checkouts have no session, so the only credential is the single-use
 * access token minted at checkout and handed back through the Stripe return
 * URL. Only its SHA-256 hash is stored, so we hash the candidate and compare
 * in constant time; the token also expires 24 hours after checkout.
 *
 * Returns null for every failure mode — unknown order, wrong token, expired
 * token — so the page cannot be used to probe which order numbers exist.
 */
export async function getOrderForAccessToken(
  orderNumber: string,
  accessToken: string,
) {
  if (!orderNumber || !accessToken) return null;
  if (!process.env.DATABASE_URL) return null;

  const order = await db.order.findUnique({
    where: { number: orderNumber },
    include: {
      items: true,
      addresses: true,
      giftBoxOrderItems: true,
      payments: { include: { refunds: true } },
      shipments: true,
    },
  });
  if (!order?.accessTokenHash) return null;
  if (order.accessTokenExpiresAt && order.accessTokenExpiresAt < new Date())
    return null;

  const expected = Buffer.from(order.accessTokenHash, "hex");
  const candidate = createHash("sha256").update(accessToken).digest();
  if (expected.length !== candidate.length) return null;
  if (!timingSafeEqual(expected, candidate)) return null;

  return order;
}

export type CustomerOrder = NonNullable<
  Awaited<ReturnType<typeof getOrderForAccessToken>>
>;
