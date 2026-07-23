import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdminForm } from "@/components/admin/admin-form";
import {
  AdminSection,
  Field,
  TextField,
} from "@/components/admin/product-form";
import {
  formatAddressLines,
  formatOrderNumber,
  orderCustomerName,
} from "@/lib/commerce/address";
import { readGiftBoxContents } from "@/lib/commerce/gift-box";
import { formatMoney } from "@/lib/commerce/money";
import {
  expectsPayment,
  FULFILMENT_STEPS,
  fulfilmentStepIndex,
  isRecommendedTransition,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type DomainOrderStatus,
  type DomainPaymentStatus,
} from "@/lib/commerce/order-state";
import { safeHref } from "@/lib/security/safe-url";
import { db } from "@/lib/db/client";
import {
  addTrackingAction,
  refundOrderAction,
  transitionOrderAction,
} from "@/server/actions/admin";
import { requireAdmin } from "@/server/policies/authorization";

/**
 * The single obvious next step for an order, so the page offers one button
 * rather than several competing forms. `shipment` marks the step that needs
 * carrier details instead of a plain status change.
 */
const NEXT_STEP: Partial<
  Record<
    DomainOrderStatus,
    { status?: DomainOrderStatus; label: string; hint: string; shipment?: true }
  >
> = {
  PENDING: {
    status: "CONFIRMED",
    label: "Confirm order",
    hint: "Records payment received by bank transfer or cash. Card payments confirm themselves.",
  },
  CONFIRMED: {
    status: "PROCESSING",
    label: "Start preparing",
    hint: "Tells the customer their order is being prepared.",
  },
  PROCESSING: {
    shipment: true,
    label: "Record shipment",
    hint: "Adds tracking, marks the order shipped and emails the customer — one step.",
  },
  SHIPPED: {
    status: "DELIVERED",
    label: "Mark as delivered",
    hint: "Confirms the parcel arrived.",
  },
  DELIVERED: {
    status: "COMPLETED",
    label: "Complete order",
    hint: "Closes the order once the return window has passed.",
  },
};

const POSITIVE = new Set([
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
]);
const NEGATIVE = new Set(["CANCELLED", "FAILED", "REFUNDED", "UNPAID"]);

function statusTone(status: string) {
  if (POSITIVE.has(status)) return "is-positive";
  if (NEGATIVE.has(status)) return "is-negative";
  return "is-warning";
}

const dateTime = (value: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(value);

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("orders");
  const { id } = await params;
  // Route param is the short order number; cuids still resolve so older
  // bookmarks and links keep working.
  const order = await db.order.findFirst({
    where: { OR: [{ number: id }, { id }] },
    include: {
      user: true,
      items: true,
      giftBoxOrderItems: true,
      addresses: true,
      payments: { include: { refunds: true }, orderBy: { createdAt: "desc" } },
      shipments: { orderBy: { createdAt: "desc" } },
      statusHistory: {
        include: { actor: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!order) notFound();

  const paid = order.payments.reduce(
    (sum, item) =>
      sum +
      (item.status === "PAID" ||
      item.status === "PARTIALLY_REFUNDED" ||
      item.status === "REFUNDED"
        ? item.amountCents
        : 0),
    0,
  );
  const refunds = order.payments.flatMap((payment) => payment.refunds);
  const refunded = refunds.reduce((sum, item) => sum + item.amountCents, 0);
  const refundable = Math.max(0, paid - refunded);
  const payment = order.payments[0];
  const unitCount =
    order.items.reduce((sum, item) => sum + item.quantity, 0) +
    order.giftBoxOrderItems.reduce((sum, box) => sum + box.quantity, 0);
  const step = fulfilmentStepIndex(order.status);
  const cancelled = order.status === "CANCELLED";
  const next = NEXT_STEP[order.status];

  // Every status is selectable — records sometimes have to be corrected after
  // the fact. Grouping separates the expected next step from a deliberate
  // out-of-sequence correction, which is logged as such.
  const unpaid = order.paymentStatus === "UNPAID";
  const statusOptions = ORDER_STATUSES.filter(
    (status) => status !== order.status,
  )
    .map((status) => ({
      value: status,
      label: ORDER_STATUS_LABELS[status],
      recommended: isRecommendedTransition(order.status, status),
      warning: expectsPayment(status) && unpaid ? " (order is unpaid)" : "",
    }))
    // Expected next steps sort first so the common choice is nearest the
    // cursor, without labelling the groups.
    .sort((a, b) => Number(b.recommended) - Number(a.recommended));

  return (
    <div className="admin-page-v2 admin-order">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Order {formatOrderNumber(order.number)}</p>
          <h1>{orderCustomerName(order)}</h1>
          <p>
            Placed {dateTime(order.createdAt)}
            {order.paidAt ? ` · Paid ${dateTime(order.paidAt)}` : ""} ·{" "}
            {unitCount} unit{unitCount === 1 ? "" : "s"} ·{" "}
            {formatMoney(order.totalCents, "en", order.currency)}
          </p>
        </div>
        <div className="admin-order-badges">
          <span className={`admin-status ${statusTone(order.status)}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span className={`admin-status ${statusTone(order.paymentStatus)}`}>
            {PAYMENT_STATUS_LABELS[order.paymentStatus as DomainPaymentStatus]}
          </span>
        </div>
      </div>

      {!cancelled && (
        <ol className="admin-steps" aria-label="Fulfilment progress">
          {FULFILMENT_STEPS.map((value, index) => (
            <li
              key={value}
              className={[
                "admin-step",
                index <= step ? "done" : "",
                index === step ? "current" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={index === step ? "step" : undefined}
            >
              {ORDER_STATUS_LABELS[value]}
            </li>
          ))}
        </ol>
      )}

      {/* One obvious action, with the manual override folded into the same
          strip — rather than three forms competing for attention. */}
      {(next || statusOptions.length > 0) && (
        <section className="admin-next-step">
          {next && (
            <div className="admin-next-step-main">
              <div className="admin-next-step-copy">
                <span className="admin-muted-label">Next step</span>
                <strong>{next.label}</strong>
                <small>{next.hint}</small>
              </div>
              {next.shipment ? (
                <AdminForm
                  action={addTrackingAction}
                  submitLabel="Record shipment & notify"
                  className="admin-form admin-next-step-form"
                >
                  <input type="hidden" name="orderId" value={order.id} />
                  <div className="admin-next-step-fields">
                    <Field label="Carrier" name="provider" required />
                    <Field
                      label="Tracking number"
                      name="trackingNumber"
                      required
                    />
                    <Field
                      label="Tracking link"
                      name="trackingUrl"
                      type="url"
                    />
                  </div>
                </AdminForm>
              ) : (
                <AdminForm
                  action={transitionOrderAction}
                  submitLabel={next.label}
                  className="admin-form admin-next-step-form"
                >
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="status" value={next.status} />
                </AdminForm>
              )}
            </div>
          )}

          {statusOptions.length > 0 && (
            <AdminForm
              action={transitionOrderAction}
              submitLabel="Update"
              className="admin-form admin-status-inline"
            >
              <input type="hidden" name="orderId" value={order.id} />
              <label htmlFor="manual-status">
                {next ? "Or set status to" : "Set status to"}
              </label>
              <select id="manual-status" name="status" required defaultValue="">
                <option value="" disabled>
                  Choose…
                </option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                    {option.warning}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="note"
                maxLength={1000}
                placeholder="Internal note (optional)"
              />
            </AdminForm>
          )}
        </section>
      )}

      <div className="admin-two-column">
        <div className="admin-stack">
          <section className="admin-card">
            <header>
              <h2>Items</h2>
              <span className="admin-muted-label">
                {unitCount} unit{unitCount === 1 ? "" : "s"}
              </span>
            </header>
            {order.items.map((item) => (
              <div className="admin-list-row" key={item.id}>
                <span>
                  <strong>{item.productName}</strong>
                  <small>
                    {item.sku} · {item.weightGrams} g · {item.quantity} ×{" "}
                    {formatMoney(item.unitPriceCents, "en", order.currency)}
                  </small>
                </span>
                <span>
                  <strong>
                    {formatMoney(item.lineTotalCents, "en", order.currency)}
                  </strong>
                </span>
              </div>
            ))}
            {order.giftBoxOrderItems.map((box) => (
              <div className="admin-list-row" key={box.id}>
                <span>
                  <strong>{box.giftBoxName}</strong>
                  <small>
                    Gift box · {box.sizeName}
                    {box.packagingName ? ` · ${box.packagingName}` : ""} ·{" "}
                    {box.quantity} ×{" "}
                    {formatMoney(box.unitPriceCents, "en", order.currency)}
                  </small>
                  {/* What the customer actually chose — needed to pick and
                      pack the box, and absent from this page until now. */}
                  {readGiftBoxContents(box.snapshot).map((item) => (
                    <small className="admin-box-content" key={item.name}>
                      {item.quantity}× {item.name}
                      {item.weightGrams ? ` (${item.weightGrams} g)` : ""}
                    </small>
                  ))}
                  {box.giftMessage && (
                    <small className="admin-gift-message">
                      “{box.giftMessage}”
                    </small>
                  )}
                </span>
                <span>
                  <strong>
                    {formatMoney(box.totalCents, "en", order.currency)}
                  </strong>
                </span>
              </div>
            ))}
            {!order.items.length && !order.giftBoxOrderItems.length && (
              <p className="admin-empty">This order has no line items.</p>
            )}
            <dl className="admin-summary">
              <div>
                <dt>Subtotal</dt>
                <dd>
                  {formatMoney(order.subtotalCents, "en", order.currency)}
                </dd>
              </div>
              {order.discountCents > 0 && (
                <div>
                  <dt>
                    Discount{order.couponCode ? ` · ${order.couponCode}` : ""}
                  </dt>
                  <dd>
                    −{formatMoney(order.discountCents, "en", order.currency)}
                  </dd>
                </div>
              )}
              <div>
                <dt>Shipping</dt>
                <dd>
                  {formatMoney(order.shippingCents, "en", order.currency)}
                </dd>
              </div>
              <div>
                <dt>VAT included</dt>
                <dd>{formatMoney(order.taxCents, "en", order.currency)}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>
                  <strong>
                    {formatMoney(order.totalCents, "en", order.currency)}
                  </strong>
                </dd>
              </div>
            </dl>
          </section>

          <section className="admin-card">
            <header>
              <h2>Timeline</h2>
              <span className="admin-muted-label">
                {order.statusHistory.length} event
                {order.statusHistory.length === 1 ? "" : "s"}
              </span>
            </header>
            {order.statusHistory.map((event) => (
              <div className="admin-list-row" key={event.id}>
                <span>
                  <strong>
                    {event.oldStatus
                      ? `${ORDER_STATUS_LABELS[event.oldStatus]} → `
                      : ""}
                    {ORDER_STATUS_LABELS[event.newStatus]}
                  </strong>
                  <small>
                    {event.reason ?? "No reason recorded"} ·{" "}
                    {event.actor?.name ?? "System"}
                  </small>
                </span>
                <time>{dateTime(event.createdAt)}</time>
              </div>
            ))}
            {!order.statusHistory.length && (
              <p className="admin-empty">No status changes recorded yet.</p>
            )}
          </section>
        </div>

        <div className="admin-stack">
          <section className="admin-card">
            <header>
              <h2>Customer</h2>
              {order.user && (
                <Link href={`/admin/customers/${order.user.id}`}>
                  Profile <ExternalLink size={12} />
                </Link>
              )}
            </header>
            <div className="admin-card-body">
              <p className="admin-customer-line">
                <strong>{orderCustomerName(order)}</strong>
                {!order.user && <span className="admin-status">Guest</span>}
              </p>
              <p className="admin-contact-line">
                <a href={`mailto:${order.email}`}>{order.email}</a>
              </p>
              {order.addresses.map((address) => (
                <div className="admin-address" key={address.id}>
                  <span className="admin-muted-label">{address.type}</span>
                  <address>
                    {formatAddressLines(address).map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </address>
                  {address.phone && (
                    <a href={`tel:${address.phone}`}>{address.phone}</a>
                  )}
                </div>
              ))}
              {!order.addresses.length && (
                <p className="admin-empty">No address recorded.</p>
              )}
            </div>
          </section>

          <section className="admin-card">
            <header>
              <h2>Payment</h2>
              <span
                className={`admin-status ${statusTone(order.paymentStatus)}`}
              >
                {
                  PAYMENT_STATUS_LABELS[
                    order.paymentStatus as DomainPaymentStatus
                  ]
                }
              </span>
            </header>
            <dl className="admin-summary">
              <div>
                <dt>Captured</dt>
                <dd>{formatMoney(paid, "en", order.currency)}</dd>
              </div>
              {refunded > 0 && (
                <div>
                  <dt>Refunded</dt>
                  <dd>−{formatMoney(refunded, "en", order.currency)}</dd>
                </div>
              )}
              <div>
                <dt>Refundable</dt>
                <dd>{formatMoney(refundable, "en", order.currency)}</dd>
              </div>
              {payment?.providerPaymentId && (
                <div>
                  <dt>Payment intent</dt>
                  <dd className="admin-mono">{payment.providerPaymentId}</dd>
                </div>
              )}
              {payment?.failureMessage && (
                <div>
                  <dt>Failure</dt>
                  <dd>{payment.failureMessage}</dd>
                </div>
              )}
            </dl>
            {refunds.map((refund) => (
              <div className="admin-list-row" key={refund.id}>
                <span>
                  <strong>
                    {formatMoney(refund.amountCents, "en", order.currency)}{" "}
                    refunded
                  </strong>
                  <small>{refund.reason ?? "No reason recorded"}</small>
                </span>
                <time>{dateTime(refund.createdAt)}</time>
              </div>
            ))}
          </section>

          {order.shipments.length > 0 && (
            <section className="admin-card">
              <header>
                <h2>Shipments</h2>
              </header>
              {order.shipments.map((shipment) => (
                <div className="admin-list-row" key={shipment.id}>
                  <span>
                    <strong>{shipment.provider}</strong>
                    <small className="admin-mono">
                      {shipment.trackingNumber}
                    </small>
                  </span>
                  <span>
                    {safeHref(shipment.trackingUrl) && (
                      <a
                        href={safeHref(shipment.trackingUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Track <ExternalLink size={11} />
                      </a>
                    )}
                  </span>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>

      {/* Everything below is deliberately collapsed: rarely needed, and two of
          the three move money or cancel an order. */}
      <div className="admin-more-actions">
        {order.shipments.length > 0 && (
          <details className="admin-disclosure">
            <summary>Add another parcel</summary>
            <div className="admin-disclosure-body">
              <AdminForm action={addTrackingAction} submitLabel="Add tracking">
                <input type="hidden" name="orderId" value={order.id} />
                <AdminSection title="">
                  <Field label="Carrier" name="provider" required />
                  <Field
                    label="Tracking number"
                    name="trackingNumber"
                    required
                  />
                  <Field label="Tracking link" name="trackingUrl" type="url" />
                </AdminSection>
              </AdminForm>
            </div>
          </details>
        )}

        <details className="admin-disclosure is-danger">
          <summary>Issue a refund</summary>
          <div className="admin-disclosure-body">
            {refundable > 0 ? (
              <>
                <p className="admin-disclosure-hint">
                  {formatMoney(refundable, "en", order.currency)} can be
                  refunded to the original card. This moves real money and
                  cannot be undone.
                </p>
                <AdminForm
                  action={refundOrderAction}
                  submitLabel="Refund to customer"
                >
                  <input type="hidden" name="orderId" value={order.id} />
                  <AdminSection title="">
                    <Field
                      label="Amount in cents"
                      name="amountCents"
                      required
                      type="number"
                      min={1}
                      max={refundable}
                    />
                    <TextField label="Reason" name="reason" />
                  </AdminSection>
                </AdminForm>
              </>
            ) : (
              <p className="admin-empty">
                {paid === 0
                  ? "Nothing has been captured for this order yet."
                  : "The full captured amount has already been refunded."}
              </p>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
