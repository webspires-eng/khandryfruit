import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Receipt,
  XCircle,
} from "lucide-react";

import { isLocale, type AppLocale } from "@/config/site";
import { PendingPaymentRefresh } from "@/features/order/pending-payment-refresh";
import { formatAddressLines, formatOrderNumber } from "@/lib/commerce/address";
import { readGiftBoxContents } from "@/lib/commerce/gift-box";
import { formatMoney } from "@/lib/commerce/money";
import { confirmOrderFromCheckoutSession } from "@/server/services/checkout-session";
import {
  getOrderForAccessToken,
  type CustomerOrder,
} from "@/server/services/order-access";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order confirmation",
  robots: { index: false, follow: false },
};

const t = (locale: AppLocale, de: string, en: string) =>
  locale === "de" ? de : en;

function formatDate(value: Date, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(value);
}

export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const orderNumber = typeof query.order === "string" ? query.order : "";
  const accessToken = typeof query.access === "string" ? query.access : "";
  const sessionId =
    typeof query.session_id === "string" ? query.session_id : "";
  let order = await getOrderForAccessToken(orderNumber, accessToken);

  if (!order) return <OrderUnavailable locale={locale} />;

  // The signed webhook is the primary path, but it may not have arrived yet —
  // and in local development Stripe cannot reach the machine at all. Verify the
  // session directly so a customer who has paid is not shown an unpaid order.
  if (order.paymentStatus === "UNPAID" && sessionId) {
    const result = await confirmOrderFromCheckoutSession({
      orderId: order.id,
      sessionId,
    });
    if (result === "confirmed")
      order = (await getOrderForAccessToken(orderNumber, accessToken)) ?? order;
  }

  const paid = order.paymentStatus === "PAID";
  // Payment failures no longer have their own status: an unpaid order that was
  // cancelled is the observable outcome the customer needs to see.
  const failed = order.status === "CANCELLED";
  const shipping =
    order.addresses.find((address) => address.type === "SHIPPING") ??
    order.addresses[0];
  const payment = order.payments[0];
  const refunded = order.payments
    .flatMap((item) => item.refunds)
    .reduce((sum, item) => sum + item.amountCents, 0);
  const addressLines = shipping ? formatAddressLines(shipping) : [];

  return (
    <div className="page-shell order-page container">
      {!paid && !failed && <PendingPaymentRefresh />}

      <OrderHero order={order} locale={locale} paid={paid} failed={failed} />
      {!failed && <FulfilmentSteps order={order} locale={locale} />}

      <div className="order-grid">
        <div className="order-column">
          <section className="order-card">
            <h2>
              <Receipt size={18} />
              {t(locale, "Bestellübersicht", "Order summary")}
            </h2>

            {order.items.map((item) => (
              <div className="order-line" key={item.id}>
                <span className="order-line-qty">{item.quantity}×</span>
                <span className="order-line-body">
                  <strong>{item.productName}</strong>
                  <small>
                    {item.sku} · {item.weightGrams} g ·{" "}
                    {formatMoney(item.unitPriceCents, locale, order.currency)}{" "}
                    {t(locale, "je Stück", "each")}
                  </small>
                </span>
                <span className="order-line-price">
                  {formatMoney(item.lineTotalCents, locale, order.currency)}
                </span>
              </div>
            ))}

            {order.giftBoxOrderItems.map((box) => (
              <div className="order-line" key={box.id}>
                <span className="order-line-qty">{box.quantity}×</span>
                <span className="order-line-body">
                  <strong>{box.giftBoxName}</strong>
                  <small>
                    {t(locale, "Geschenkbox", "Gift box")} · {box.sizeName}
                    {box.packagingName ? ` · ${box.packagingName}` : ""} ·{" "}
                    {formatMoney(box.unitPriceCents, locale, order.currency)}{" "}
                    {t(locale, "je Stück", "each")}
                  </small>
                  {/* The products chosen inside the box, recorded at checkout. */}
                  {readGiftBoxContents(box.snapshot).map((item) => (
                    <small className="order-line-content" key={item.name}>
                      {item.quantity}× {item.name}
                      {item.weightGrams ? ` (${item.weightGrams} g)` : ""}
                    </small>
                  ))}
                  {box.giftMessage && (
                    <small className="order-line-gift">
                      {t(locale, "Grußtext", "Gift message")}: “
                      {box.giftMessage}”
                    </small>
                  )}
                </span>
                <span className="order-line-price">
                  {formatMoney(box.totalCents, locale, order.currency)}
                </span>
              </div>
            ))}

            <dl className="order-totals">
              <div>
                <dt>{t(locale, "Zwischensumme", "Subtotal")}</dt>
                <dd>
                  {formatMoney(order.subtotalCents, locale, order.currency)}
                </dd>
              </div>
              {order.discountCents > 0 && (
                <div>
                  <dt>
                    {t(locale, "Rabatt", "Discount")}
                    {order.couponCode ? ` · ${order.couponCode}` : ""}
                  </dt>
                  <dd>
                    −{formatMoney(order.discountCents, locale, order.currency)}
                  </dd>
                </div>
              )}
              <div>
                <dt>{t(locale, "Versand", "Shipping")}</dt>
                <dd>
                  {order.shippingCents === 0
                    ? t(locale, "Kostenlos", "Free")
                    : formatMoney(order.shippingCents, locale, order.currency)}
                </dd>
              </div>
              <div className="is-tax">
                <dt>{t(locale, "Enthaltene MwSt.", "VAT included")}</dt>
                <dd>{formatMoney(order.taxCents, locale, order.currency)}</dd>
              </div>
              <div className="is-total">
                <dt>{t(locale, "Gesamtbetrag", "Total paid")}</dt>
                <dd>{formatMoney(order.totalCents, locale, order.currency)}</dd>
              </div>
              {refunded > 0 && (
                <div>
                  <dt>{t(locale, "Erstattet", "Refunded")}</dt>
                  <dd>−{formatMoney(refunded, locale, order.currency)}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="order-card order-next">
            <h2>{t(locale, "Wie es weitergeht", "What happens next")}</h2>
            <ol className="order-next-list">
              <li>
                <strong>{t(locale, "Bestätigung", "Confirmation")}</strong>
                {t(
                  locale,
                  "Sie erhalten eine Bestellbestätigung per E-Mail.",
                  "You receive an order confirmation by email.",
                )}
              </li>
              <li>
                <strong>{t(locale, "Verpackung", "Packing")}</strong>
                {t(
                  locale,
                  "Wir kommissionieren und verpacken Ihre Bestellung in Duisburg.",
                  "We pick and pack your order in Duisburg.",
                )}
              </li>
              <li>
                <strong>{t(locale, "Versand", "Dispatch")}</strong>
                {t(
                  locale,
                  "Nach Übergabe an den Versanddienstleister senden wir die Sendungsverfolgung.",
                  "Once handed to the carrier we send you the tracking details.",
                )}
              </li>
            </ol>
            <div className="order-actions">
              <Link className="button" href={`/${locale}/shop`}>
                {t(locale, "Weiter einkaufen", "Continue shopping")}
              </Link>
              <Link className="button secondary" href={`/${locale}/contact`}>
                {t(locale, "Frage zur Bestellung", "Question about this order")}
              </Link>
            </div>
          </section>
        </div>

        <div className="order-column side">
          <section className="order-card">
            <h2>
              <MapPin size={18} />
              {t(locale, "Lieferadresse", "Delivery address")}
            </h2>
            {addressLines.length ? (
              <address className="order-address">
                {addressLines.map((line, index) => (
                  <span
                    key={line}
                    className={index === 0 ? "order-address-name" : undefined}
                  >
                    {line}
                    <br />
                  </span>
                ))}
                {shipping?.phone && (
                  <span className="order-address-phone">{shipping.phone}</span>
                )}
              </address>
            ) : (
              <p className="order-note">
                {t(
                  locale,
                  "Keine Lieferadresse hinterlegt.",
                  "No delivery address recorded.",
                )}
              </p>
            )}
            <dl className="order-facts">
              <div>
                <dt>{t(locale, "E-Mail", "Email")}</dt>
                <dd>{order.email}</dd>
              </div>
              <div>
                <dt>{t(locale, "Versandart", "Shipping method")}</dt>
                <dd>{t(locale, "Standard Deutschland", "Germany standard")}</dd>
              </div>
              <div>
                <dt>{t(locale, "Bestellstatus", "Order status")}</dt>
                <dd>{orderStatusLabel(order.status, locale)}</dd>
              </div>
            </dl>
            <p className="order-note">
              {t(
                locale,
                "Ziel 3–4 Werktage. Dies ist noch kein zugesagtes Lieferdatum.",
                "Targeting 3–4 working days. This is not yet a guaranteed delivery date.",
              )}
            </p>
          </section>

          <section className="order-card">
            <h2>
              <CreditCard size={18} />
              {t(locale, "Zahlung", "Payment")}
            </h2>
            <dl className="order-facts">
              <div>
                <dt>{t(locale, "Status", "Status")}</dt>
                <dd>
                  <span
                    className={`order-pill ${
                      paid ? "is-paid" : failed ? "is-failed" : "is-pending"
                    }`}
                  >
                    {paymentStatusLabel(order.paymentStatus, locale)}
                  </span>
                </dd>
              </div>
              <div>
                <dt>{t(locale, "Methode", "Method")}</dt>
                <dd>{t(locale, "Stripe Checkout", "Stripe Checkout")}</dd>
              </div>
              <div>
                <dt>{t(locale, "Betrag", "Amount")}</dt>
                <dd>{formatMoney(order.totalCents, locale, order.currency)}</dd>
              </div>
              {order.paidAt && (
                <div>
                  <dt>{t(locale, "Bezahlt am", "Paid on")}</dt>
                  <dd>{formatDate(order.paidAt, locale)}</dd>
                </div>
              )}
              {payment?.failureMessage && (
                <div>
                  <dt>{t(locale, "Hinweis", "Note")}</dt>
                  <dd>{payment.failureMessage}</dd>
                </div>
              )}
            </dl>
            <p className="order-note">
              {t(
                locale,
                "Die Zahlung wird ausschließlich über den signierten Stripe-Webhook bestätigt.",
                "Payment is confirmed exclusively through the signed Stripe webhook.",
              )}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function OrderHero({
  order,
  locale,
  paid,
  failed,
}: {
  order: CustomerOrder;
  locale: AppLocale;
  paid: boolean;
  failed: boolean;
}) {
  const state = failed ? "failed" : paid ? "paid" : "pending";
  const Icon = failed ? XCircle : paid ? CheckCircle2 : Clock;
  const badge = failed
    ? t(locale, "Nicht bezahlt", "Not paid")
    : paid
      ? t(locale, "Bezahlt", "Payment confirmed")
      : t(locale, "Wird geprüft", "Verifying");
  const heading = failed
    ? t(locale, "Zahlung nicht abgeschlossen", "Payment not completed")
    : paid
      ? t(locale, "Vielen Dank für Ihre Bestellung", "Thank you for your order")
      : t(locale, "Zahlung wird bestätigt", "Confirming your payment");
  const body = failed
    ? t(
        locale,
        "Ihre Zahlung wurde nicht bestätigt. Reservierter Bestand wird automatisch freigegeben. Sie können den Kauf jederzeit erneut starten.",
        "Your payment was not confirmed. Reserved stock is released automatically, and you can start the purchase again at any time.",
      )
    : paid
      ? t(
          locale,
          "Ihre Zahlung ist bestätigt und die Bestellung ist bei uns eingegangen. Eine Bestätigung geht an die unten genannte E-Mail-Adresse.",
          "Your payment is confirmed and your order has reached us. A confirmation is on its way to the email address below.",
        )
      : t(
          locale,
          "Wir prüfen die Zahlung über den signierten Stripe-Webhook. Diese Seite aktualisiert sich automatisch.",
          "We are verifying the payment through the signed Stripe webhook. This page updates automatically.",
        );

  return (
    <header className={`order-hero ${state}`}>
      <div className="order-hero-inner">
        <span className="order-badge">
          <Icon size={15} />
          {badge}
        </span>
        <h1>{heading}</h1>
        <p>{body}</p>
      </div>
      <dl className="order-hero-facts">
        <div>
          <dt>{t(locale, "Bestellnummer", "Order number")}</dt>
          <dd>{formatOrderNumber(order.number)}</dd>
        </div>
        <div>
          <dt>{t(locale, "Bestelldatum", "Order date")}</dt>
          <dd>{formatDate(order.createdAt, locale)}</dd>
        </div>
        <div>
          <dt>{t(locale, "Gesamtbetrag", "Order total")}</dt>
          <dd>{formatMoney(order.totalCents, locale, order.currency)}</dd>
        </div>
      </dl>
    </header>
  );
}

/** Visual progress through fulfilment, derived from the order status. */
function FulfilmentSteps({
  order,
  locale,
}: {
  order: CustomerOrder;
  locale: AppLocale;
}) {
  const reached: Record<string, number> = {
    PENDING: 0,
    CANCELLED: 0,
    CONFIRMED: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    DELIVERED: 4,
    COMPLETED: 5,
  };
  const current = reached[order.status] ?? 0;
  const steps = [
    t(locale, "Bestellt", "Ordered"),
    t(locale, "Bestätigt", "Confirmed"),
    t(locale, "In Bearbeitung", "Processing"),
    t(locale, "Versendet", "Shipped"),
    t(locale, "Zugestellt", "Delivered"),
    t(locale, "Abgeschlossen", "Completed"),
  ];
  return (
    <ol className="order-steps">
      {steps.map((label, index) => (
        <li
          key={label}
          className={[
            "order-step",
            index <= current ? "done" : "",
            index === current ? "current" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-current={index === current ? "step" : undefined}
        >
          {label}
        </li>
      ))}
    </ol>
  );
}

function OrderUnavailable({ locale }: { locale: AppLocale }) {
  return (
    <div className="page-shell order-page container">
      <div className="order-unavailable">
        <h1>{t(locale, "Bestellung nicht abrufbar", "Order unavailable")}</h1>
        <p>
          {t(
            locale,
            "Dieser Bestell-Link ist ungültig oder abgelaufen. Ihre Bestelldetails erhalten Sie jederzeit über die Bestätigungs-E-Mail oder unser Kontaktformular.",
            "This order link is invalid or has expired. You can retrieve your order details from your confirmation email or through our contact form.",
          )}
        </p>
        <div className="order-actions">
          <Link className="button" href={`/${locale}/shop`}>
            {t(locale, "Zum Shop", "Browse shop")}
          </Link>
          <Link className="button secondary" href={`/${locale}/contact`}>
            {t(locale, "Kontakt", "Contact")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function orderStatusLabel(status: string, locale: AppLocale) {
  const labels: Record<string, [string, string]> = {
    PENDING: ["Zahlung ausstehend", "Awaiting payment"],
    CONFIRMED: ["Bestätigt", "Confirmed"],
    PROCESSING: ["In Bearbeitung", "Processing"],
    SHIPPED: ["Versendet", "Shipped"],
    DELIVERED: ["Zugestellt", "Delivered"],
    COMPLETED: ["Abgeschlossen", "Completed"],
    CANCELLED: ["Storniert", "Cancelled"],
  };
  const label = labels[status];
  return label ? t(locale, label[0], label[1]) : status;
}

function paymentStatusLabel(status: string, locale: AppLocale) {
  const labels: Record<string, [string, string]> = {
    UNPAID: ["Offen", "Unpaid"],
    PAID: ["Bezahlt", "Paid"],
    REFUNDED: ["Erstattet", "Refunded"],
  };
  const label = labels[status];
  return label ? t(locale, label[0], label[1]) : status;
}
