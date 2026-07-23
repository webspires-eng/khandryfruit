import "server-only";

import {
  formatGiftBoxContents,
  readGiftBoxContents,
} from "@/lib/commerce/gift-box";
import { formatMoney } from "@/lib/commerce/money";
import { db } from "@/lib/db/client";
import { getEmailProvider } from "@/lib/email/provider";
import {
  buildNewOrderAdminEmail,
  buildOrderReceiptEmail,
  buildOrderStatusEmail,
  hasOrderStatusEmail,
  type OrderEmailLine,
} from "@/lib/email/templates";
import {
  formatAddressLines,
  formatOrderNumber,
  orderCustomerName,
} from "@/lib/commerce/address";
import type { AppLocale } from "@/config/site";
import { env } from "@/lib/env";
import { logger } from "@/lib/logging/logger";
import { translate } from "@/lib/i18n/translate";
import { safeHref } from "@/lib/security/safe-url";

/**
 * Emails the customer that their order has moved to a new status.
 *
 * Delivery failures are logged and swallowed: an admin must never see a
 * fulfilment update fail because the mail relay was unreachable, and the status
 * change itself is already committed by the time this runs.
 */
export async function sendOrderStatusEmail(
  orderId: string,
  status: string,
  options: { includeTracking?: boolean } = {},
) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        addresses: { where: { type: "SHIPPING" }, take: 1 },
        shipments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!order) return;

    const locale = (order.locale as AppLocale) ?? "de";
    if (!hasOrderStatusEmail(locale, status)) return;

    // A shipment row without a tracking number tells the customer nothing.
    const shipment = options.includeTracking ? order.shipments[0] : undefined;
    const tracking =
      shipment?.trackingNumber != null
        ? {
            provider: shipment.provider,
            number: shipment.trackingNumber,
            // Never mail a javascript:/data: link to a customer.
            url: safeHref(shipment.trackingUrl) ?? null,
          }
        : undefined;
    await getEmailProvider().send(
      buildOrderStatusEmail({
        locale,
        to: order.email,
        customerName: orderCustomerName(order),
        orderNumber: formatOrderNumber(order.number),
        status,
        total: formatMoney(order.totalCents, locale, order.currency),
        tracking,
      }),
    );
    logger.info("order_status_email_sent", { orderId, status });
  } catch {
    logger.error("order_status_email_failed", { orderId, status });
  }
}

/**
 * Sends the two emails that a confirmed order produces: a full receipt to the
 * customer, and a new-order alert to the shop.
 *
 * Kept separate from `sendOrderStatusEmail` because these carry line items and
 * totals, not just a status word. Failures are logged and swallowed — payment
 * has already settled by the time this runs, and a mail outage must not undo it.
 */
export async function sendOrderConfirmationEmails(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
        giftBoxOrderItems: true,
        addresses: { where: { type: "SHIPPING" }, take: 1 },
      },
    });
    if (!order) return;

    const locale = (order.locale as AppLocale) ?? "de";
    const money = (cents: number) => formatMoney(cents, locale, order.currency);
    const reference = formatOrderNumber(order.number);

    const lines: OrderEmailLine[] = [
      ...order.items.map((item) => ({
        name: item.productName,
        detail: `${item.sku} · ${item.weightGrams} g`,
        quantity: item.quantity,
        total: money(item.lineTotalCents),
      })),
      ...order.giftBoxOrderItems.map((box) => ({
        name: box.giftBoxName,
        // Include what is inside the box, so the receipt and the packing alert
        // both say what was actually bought.
        detail: [
          box.sizeName,
          box.packagingName,
          formatGiftBoxContents(readGiftBoxContents(box.snapshot)),
        ]
          .filter(Boolean)
          .join(" · "),
        quantity: box.quantity,
        total: money(box.totalCents),
      })),
    ];
    const totals = {
      subtotal: money(order.subtotalCents),
      ...(order.discountCents > 0
        ? { discount: money(order.discountCents) }
        : {}),
      shipping:
        order.shippingCents === 0
          ? translate(locale, "emails.order.shippingFree")
          : money(order.shippingCents),
      tax: money(order.taxCents),
      total: money(order.totalCents),
    };
    const address = order.addresses[0]
      ? formatAddressLines(order.addresses[0])
      : [];
    const customerName = orderCustomerName(order);
    const provider = getEmailProvider();

    try {
      await provider.send(
        buildOrderReceiptEmail({
          locale,
          to: order.email,
          customerName,
          orderNumber: reference,
          orderDate: order.createdAt.toISOString(),
          lines,
          totals,
          deliveryAddress: address,
        }),
      );
      logger.info("order_receipt_email_sent", { orderId });
    } catch {
      logger.error("order_receipt_email_failed", { orderId });
    }

    // Never alert a placeholder inbox from production traffic.
    if (
      env.NODE_ENV === "production" &&
      env.ADMIN_EMAIL === "orders@example.com"
    ) {
      logger.warn("order_admin_email_skipped_placeholder", { orderId });
      return;
    }
    try {
      await provider.send(
        buildNewOrderAdminEmail({
          to: env.ADMIN_EMAIL,
          orderNumber: reference,
          customerName,
          customerEmail: order.email,
          lines,
          totals,
          deliveryAddress: address,
          adminUrl: `${env.NEXT_PUBLIC_SITE_URL}/admin/orders/${order.number}`,
        }),
      );
      logger.info("order_admin_email_sent", { orderId });
    } catch {
      logger.error("order_admin_email_failed", { orderId });
    }
  } catch {
    logger.error("order_confirmation_emails_failed", { orderId });
  }
}
