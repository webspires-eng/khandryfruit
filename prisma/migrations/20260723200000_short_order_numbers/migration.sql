-- Short, sequential order numbers.
--
-- Numbers were `KDF-2026-1ED9D160`: long, awkward to read over the phone, and
-- carrying a random component that served no purpose. Access to a customer's
-- order is gated by the hashed access token in the return URL, not by the
-- number being hard to guess, so the number is free to be short and readable.
--
-- Postgres assigns it from a sequence, so two simultaneous checkouts cannot
-- collide — the previous random suffix had no uniqueness guarantee at all.

CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- Renumber existing orders in the order they were placed, so the sequence
-- reflects real history rather than row order on disk.
WITH renumbered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt") AS seq
    FROM "Order"
)
UPDATE "Order" o
   SET "number" = lpad(renumbered.seq::text, 4, '0')
  FROM renumbered
 WHERE renumbered."id" = o."id";

-- Continue the sequence after the highest number now in use.
SELECT setval(
  'order_number_seq',
  GREATEST((SELECT COUNT(*) FROM "Order"), 1),
  true
);

ALTER TABLE "Order"
  ALTER COLUMN "number"
  SET DEFAULT lpad(nextval('order_number_seq')::text, 4, '0');
