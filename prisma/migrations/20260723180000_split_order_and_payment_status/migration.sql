-- Split the overloaded order status into two independent axes.
--
-- `OrderStatus` previously answered three questions at once: has the money
-- arrived, where are the goods, and how did the order end. Because REFUNDED and
-- PARTIALLY_REFUNDED existed on both `Order.status` and `Order.paymentStatus`,
-- the two columns could disagree — an order could report a refund while no money
-- had moved.
--
-- After this migration:
--   Order.status         = fulfilment only  (PENDING → … → COMPLETED, CANCELLED)
--   Order.paymentStatus  = money only       (UNPAID | PAID | REFUNDED)
--   Payment.status       = unchanged, keeps full gateway detail
--
-- Expand/contract: new types are created, data is mapped explicitly, then the
-- old columns are dropped. Every old value has a defined destination.

-- 1. New types -------------------------------------------------------------
CREATE TYPE "OrderStatus_new" AS ENUM (
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED'
);
CREATE TYPE "OrderPaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED');

-- 2. Order.status ----------------------------------------------------------
ALTER TABLE "Order" ADD COLUMN "status_new" "OrderStatus_new";

UPDATE "Order" SET "status_new" = CASE "status"
  WHEN 'PENDING_PAYMENT'    THEN 'PENDING'
  -- A failed payment leaves the order awaiting payment; the failure itself is
  -- recorded on the Payment row, which keeps its FAILED state.
  WHEN 'PAYMENT_FAILED'     THEN 'PENDING'
  WHEN 'PAID'               THEN 'CONFIRMED'
  WHEN 'PROCESSING'         THEN 'PROCESSING'
  -- PACKED is removed: with one location it marked no decision the shop acts on.
  WHEN 'PACKED'             THEN 'PROCESSING'
  WHEN 'SHIPPED'            THEN 'SHIPPED'
  WHEN 'DELIVERED'          THEN 'DELIVERED'
  -- A return is a post-delivery event, not a fulfilment state.
  WHEN 'RETURN_REQUESTED'   THEN 'DELIVERED'
  WHEN 'CANCELLED'          THEN 'CANCELLED'
  -- Fully refunded orders are closed; partially refunded ones were delivered.
  WHEN 'REFUNDED'           THEN 'CANCELLED'
  WHEN 'PARTIALLY_REFUNDED' THEN 'DELIVERED'
END::"OrderStatus_new";

ALTER TABLE "Order" ALTER COLUMN "status_new" SET NOT NULL;

-- 3. Order.paymentStatus ---------------------------------------------------
ALTER TABLE "Order" ADD COLUMN "paymentStatus_new" "OrderPaymentStatus";

UPDATE "Order" SET "paymentStatus_new" = CASE
  -- The old order status is authoritative for refunds, because the refund path
  -- always wrote it even when paymentStatus was left behind.
  WHEN "status" IN ('REFUNDED', 'PARTIALLY_REFUNDED') THEN 'REFUNDED'
  WHEN "paymentStatus" IN ('REFUNDED', 'PARTIALLY_REFUNDED') THEN 'REFUNDED'
  WHEN "paymentStatus" = 'PAID' THEN 'PAID'
  ELSE 'UNPAID'
END::"OrderPaymentStatus";

ALTER TABLE "Order" ALTER COLUMN "paymentStatus_new" SET NOT NULL;

-- 4. OrderStatusHistory ----------------------------------------------------
ALTER TABLE "OrderStatusHistory" ADD COLUMN "oldStatus_new" "OrderStatus_new";
ALTER TABLE "OrderStatusHistory" ADD COLUMN "newStatus_new" "OrderStatus_new";

UPDATE "OrderStatusHistory" SET
  "oldStatus_new" = CASE "oldStatus"
    WHEN 'PENDING_PAYMENT' THEN 'PENDING' WHEN 'PAYMENT_FAILED' THEN 'PENDING'
    WHEN 'PAID' THEN 'CONFIRMED' WHEN 'PROCESSING' THEN 'PROCESSING'
    WHEN 'PACKED' THEN 'PROCESSING' WHEN 'SHIPPED' THEN 'SHIPPED'
    WHEN 'DELIVERED' THEN 'DELIVERED' WHEN 'RETURN_REQUESTED' THEN 'DELIVERED'
    WHEN 'CANCELLED' THEN 'CANCELLED' WHEN 'REFUNDED' THEN 'CANCELLED'
    WHEN 'PARTIALLY_REFUNDED' THEN 'DELIVERED'
  END::"OrderStatus_new",
  "newStatus_new" = CASE "newStatus"
    WHEN 'PENDING_PAYMENT' THEN 'PENDING' WHEN 'PAYMENT_FAILED' THEN 'PENDING'
    WHEN 'PAID' THEN 'CONFIRMED' WHEN 'PROCESSING' THEN 'PROCESSING'
    WHEN 'PACKED' THEN 'PROCESSING' WHEN 'SHIPPED' THEN 'SHIPPED'
    WHEN 'DELIVERED' THEN 'DELIVERED' WHEN 'RETURN_REQUESTED' THEN 'DELIVERED'
    WHEN 'CANCELLED' THEN 'CANCELLED' WHEN 'REFUNDED' THEN 'CANCELLED'
    WHEN 'PARTIALLY_REFUNDED' THEN 'DELIVERED'
  END::"OrderStatus_new";

ALTER TABLE "OrderStatusHistory" ALTER COLUMN "newStatus_new" SET NOT NULL;

-- 5. Swap columns ----------------------------------------------------------
ALTER TABLE "Order" DROP COLUMN "status";
ALTER TABLE "Order" DROP COLUMN "paymentStatus";
ALTER TABLE "Order" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "Order" RENAME COLUMN "paymentStatus_new" TO "paymentStatus";

ALTER TABLE "OrderStatusHistory" DROP COLUMN "oldStatus";
ALTER TABLE "OrderStatusHistory" DROP COLUMN "newStatus";
ALTER TABLE "OrderStatusHistory" RENAME COLUMN "oldStatus_new" TO "oldStatus";
ALTER TABLE "OrderStatusHistory" RENAME COLUMN "newStatus_new" TO "newStatus";

-- 6. Retire the old type, keeping PaymentStatus for the Payment table -------
DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";

-- 7. Defaults and indexes --------------------------------------------------
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "Order" ALTER COLUMN "paymentStatus" SET DEFAULT 'UNPAID';

DROP INDEX IF EXISTS "Order_status_paymentStatus_createdAt_idx";
CREATE INDEX "Order_status_paymentStatus_createdAt_idx"
  ON "Order" ("status", "paymentStatus", "createdAt");
