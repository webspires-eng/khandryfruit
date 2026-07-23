-- Record when an order reached each lifecycle stage.
--
-- `paidAt` and `cancelledAt` already existed; the stages between them did not,
-- so "when did this ship?" could only be answered by joining Shipment — and not
-- at all for orders marked delivered or completed. Stamping them on the order
-- keeps the dates honest however the status was reached, including corrections
-- made out of sequence.

ALTER TABLE "Order" ADD COLUMN "shippedAt"   TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "completedAt" TIMESTAMP(3);

-- Backfill from history so existing orders are not left blank. The first time
-- an order entered each status is the moment it happened.
UPDATE "Order" o SET "shippedAt" = h.first_at
FROM (
  SELECT "orderId", MIN("createdAt") AS first_at
    FROM "OrderStatusHistory" WHERE "newStatus" = 'SHIPPED' GROUP BY "orderId"
) h
WHERE h."orderId" = o."id" AND o."shippedAt" IS NULL;

UPDATE "Order" o SET "deliveredAt" = h.first_at
FROM (
  SELECT "orderId", MIN("createdAt") AS first_at
    FROM "OrderStatusHistory" WHERE "newStatus" = 'DELIVERED' GROUP BY "orderId"
) h
WHERE h."orderId" = o."id" AND o."deliveredAt" IS NULL;

UPDATE "Order" o SET "completedAt" = h.first_at
FROM (
  SELECT "orderId", MIN("createdAt") AS first_at
    FROM "OrderStatusHistory" WHERE "newStatus" = 'COMPLETED' GROUP BY "orderId"
) h
WHERE h."orderId" = o."id" AND o."completedAt" IS NULL;
