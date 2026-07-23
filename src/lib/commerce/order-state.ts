/**
 * Order lifecycle.
 *
 * `status` tracks the goods only. Money is tracked separately on
 * `paymentStatus`, so the two can never contradict each other — previously both
 * carried REFUNDED and a status change could claim a refund that never happened.
 *
 *   PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED → COMPLETED
 *      ↓          ↓            ↓
 *   CANCELLED  CANCELLED   CANCELLED
 *
 * Once a parcel is with the carrier the order can no longer be cancelled; the
 * goods have to come back first, which is a refund, not a cancellation.
 */
/**
 * The expected path. Staff may move an order to any status — real shops need to
 * correct records after the fact — so this is used to *recommend* the next step
 * and to flag off-path moves in the audit log, not to forbid anything.
 *
 * Free movement is safe here only because money lives on `paymentStatus`: a
 * fulfilment change can never misstate what the customer was charged.
 */
export const orderTransitions = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
} as const;

export type DomainOrderStatus = keyof typeof orderTransitions;

/** UNPAID → PAID → REFUNDED. Set by the payment and refund services only. */
export type DomainPaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

export const ORDER_STATUSES = Object.keys(
  orderTransitions,
) as DomainOrderStatus[];

/** Human labels, used by the admin and by customer-facing copy. */
export const ORDER_STATUS_LABELS: Record<DomainOrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<DomainPaymentStatus, string> = {
  UNPAID: "Unpaid",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

/** Progress rail shown to staff and customers. CANCELLED sits outside it. */
export const FULFILMENT_STEPS = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
] as const satisfies readonly DomainOrderStatus[];

export function fulfilmentStepIndex(status: DomainOrderStatus) {
  const index = (FULFILMENT_STEPS as readonly string[]).indexOf(status);
  return index === -1 ? 0 : index;
}

/** Whether a move follows the expected path, used for grouping and auditing. */
export function isRecommendedTransition(
  from: DomainOrderStatus,
  to: DomainOrderStatus,
) {
  return (orderTransitions[from] as readonly string[]).includes(to);
}

/** Statuses that imply the goods have been handled and so need payment. */
export function expectsPayment(status: DomainOrderStatus) {
  return (
    status === "PROCESSING" ||
    status === "SHIPPED" ||
    status === "DELIVERED" ||
    status === "COMPLETED"
  );
}
