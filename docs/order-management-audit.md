# Admin order management — code audit

**Date** 23 July 2026 · **Branch** `master` · **Method** source review + runtime verification · **Findings** 14

Review of the order list, order detail, CSV export, and the three server actions that mutate
orders — status transition, shipment tracking, and Stripe refund — plus the payment and
inventory paths they depend on.

| Severity    | Count |
| ----------- | ----- |
| Critical    | 2     |
| High        | 3     |
| Medium      | 5     |
| Low         | 4     |
| Controls OK | 8     |

---

## Critical

Exploitable or money-losing. Fix before launch.

### 01 · Tracking URL accepts `javascript:` and `data:` schemes

**Location** `src/server/actions/admin.ts:1404` → rendered at `src/app/admin/orders/[id]/page.tsx`,
mailed by `src/server/services/order-notifications.ts`

**Verified by execution.** `z.string().url()` performs no scheme check. The validator was run
against four inputs:

```
ACCEPTED  javascript:alert(document.cookie)
ACCEPTED  data:text/html,<script>alert(1)</script>
ACCEPTED  vbscript:msgbox(1)
ACCEPTED  https://dhl.de/x
```

The stored value is rendered as `<a href={shipment.trackingUrl}>`, and React does not sanitise
`href`. An ORDER_MANAGER can plant a payload that executes in a SUPER_ADMIN's session when they
click "Track" — privilege escalation inside the admin panel. The same value is embedded in the
customer shipping email, so it doubles as a phishing vector aimed at buyers.

**Fix** Restrict the schema to `https:` (allow `http:` only outside production), and re-validate
on render before emitting the anchor.

### 02 · Refunds hit Stripe before the database transaction opens

**Location** `src/server/actions/admin.ts:1474–1486`

`getStripe().refunds.create()` runs, and only then does `db.$transaction` begin. If the
transaction fails — connection drop, serialization error, constraint violation — the money has
already left the account with no `Refund` row, no status change, and no audit entry. The order
still reads as fully refundable, so the same amount can be refunded again.

The Stripe idempotency key is `admin-refund-<paymentId>-<refunded>-<amount>`. Because `refunded`
is read from rows that were never written, a retry computes the identical key and Stripe returns
the original refund — masking the failure rather than preventing the second one.

**Fix** Write a PENDING refund row first, call Stripe, then mark it settled — or reconcile from
the `charge.refunded` webhook, which already exists in the handler.

---

## High

### 03 · ORDER_MANAGER can move money without two-factor authentication

**Location** `src/server/policies/authorization.ts:28–33` · `src/config/admin.ts:43`

The production 2FA gate is conditioned on role:

```ts
if (
  process.env.NODE_ENV === "production" &&
  (role === "ADMIN" || role === "SUPER_ADMIN") &&
  !session.user.twoFactorEnabled
)
  forbidden();
```

ORDER_MANAGER holds the `orders` area and therefore reaches `refundOrderAction`, but is exempt
from that check. The role that most routinely issues refunds is the one role not required to hold
a second factor.

**Fix** Require 2FA for every role with a non-`dashboard` area, or at minimum gate the refund
action on it explicitly.

### 04 · Cancelling or refunding a paid order never returns stock

**Location** `src/server/actions/admin.ts` — `transitionOrderAction`, `refundOrderAction`

**Verified.** Neither action contains a single `inventory` write. At payment,
`confirmOrderPayment` decrements `onHand` and clears `reserved`. Moving that order to CANCELLED,
REFUNDED, or PARTIALLY_REFUNDED changes status only. The units stay deducted and the shop
under-sells until someone notices and corrects inventory by hand.

The schema anticipates this: `AdjustmentType` declares a `RETURN` member that appears nowhere in
`src/`.

**Fix** On cancel/refund, create a `RETURN` adjustment restoring `onHand`. Restocking is a
judgement call for spoiled goods, so make it an explicit checkbox rather than silent.

### 05 · Refund validation is not serialised against concurrent requests

**Location** `src/server/actions/admin.ts:1459–1483`

`payment.findFirst` and `validateRefund` execute outside any transaction and take no lock. Two
refunds submitted together both read `refunded = 0` and both pass validation. Because their
amounts differ, their idempotency keys differ, so Stripe honours both — a €10 and a €5 refund
against a €12 payment both succeed.

**Fix** Re-read the payment with `SELECT … FOR UPDATE` inside the transaction and re-run
`validateRefund` there.

---

## Medium

### 06 · Order list paginates in the query but renders no pagination controls

**Location** `src/app/admin/orders/page.tsx:18–19, 61–62`

**Verified.** `skip`, `take = 25`, and a total `count` are all computed, but the page renders zero
`page=` links (`grep -c "href.*page=" → 0`). Once the shop passes 25 orders, order 26 onward is
reachable only by typing the query string manually. The header prints the true total, so the gap
is invisible until someone goes looking for an order that "isn't there".

**Fix** Render previous/next controls preserving the active `q`, `status`, and `payment` filters.

### 07 · CSV export is open to formula injection

**Location** `src/app/admin/orders/export/route.ts:5–6`

The escaper handles quotes and nothing else:

```ts
const csv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
```

Customer-controlled fields — name, company, both address lines, city — now flow into the export.
`checkoutAddressSchema` constrains length but not leading characters, so a value beginning `=`,
`+`, `-`, or `@` is interpreted as a formula when the file opens in Excel, executing in the
operator's context.

**Fix** Prefix any cell starting with those characters with a single quote, or emit the file as
XLSX with explicit text typing.

### 08 · Export loads every order and its relations in one unbounded query

**Location** `src/app/admin/orders/export/route.ts:9–14`

`findMany` carries no `take` and joins `user` and `addresses`, building the entire result plus a
full string array in memory before the first byte is sent. This is fine now and becomes an outage
at tens of thousands of orders, on a serverless function with a fixed memory ceiling.

**Fix** Stream the response and page the cursor, or bound the export by a required date range.

### 09 · Payment selection is non-deterministic when an order has several

**Location** `src/app/admin/orders/[id]/page.tsx:84` · `src/server/actions/admin.ts:1459`

The detail page reads `order.payments[0]` and the refund action uses `findFirst` — neither
specifies `orderBy`, so Postgres may return rows in any order. Today each order has exactly one
payment, so the bug is dormant; it wakes up the moment a retry or partial capture adds a second
row, and then the panel may show one payment while the refund targets another.

**Fix** Add `orderBy: { createdAt: "desc" }` to both, and total across all payments rather than
reading one.

### 10 · No rate limiting on any admin mutation

**Location** `src/server/actions/admin.ts` — 0 occurrences of `checkRateLimit`

Public checkout is limited to 10 requests per 10 minutes per IP via `checkRateLimit`. No admin
action uses it. A stolen session or a mis-scripted integration can drive unbounded refunds, status
churn, or shipment rows, each one a Stripe call or a write.

**Fix** Apply a per-actor limit to the money-moving actions at minimum, reusing the existing
Upstash limiter.

---

## Low

### 11 · Tracking can be attached to a non-existent order, and duplicated freely

**Location** `src/server/actions/admin.ts:1416–1425`

`shipment.create` runs without checking the order exists — a bad `orderId` surfaces as a raw
foreign-key error rather than a usable message. Nothing prevents the same tracking number being
added repeatedly, and `status` is hard-coded to `LABEL_CREATED` with no path to any later
`ShipmentStatus`, so the enum's remaining states are unreachable through the UI.

### 12 · Re-authentication window measures session age, not recent authentication

**Location** `src/server/policies/authorization.ts:34–37`

The `recent` guard compares against `session.createdAt`, which never advances. Fifteen minutes
after signing in, refunds become impossible until the operator fully signs out and back in. The
intent — force fresh proof of identity before moving money — is right; the mechanism makes it a
daily annoyance and trains people to keep a second browser signed in.

### 13 · Cancelling an unpaid order leaves stock reserved until the cron sweep

**Location** `src/server/actions/admin.ts` · `src/app/api/cron/reservations/route.ts`

An admin cancelling a PENDING_PAYMENT order does not release its reservations. They clear when
`reservationExpiresAt` passes and the 15-minute cron runs — up to 30 minutes of stock held for an
order that is already dead. Self-healing, but it suppresses availability in the meantime.

### 14 · Orders cannot be searched by product or SKU

**Location** `src/app/admin/orders/page.tsx:20–52`

Search covers order number, email, account name, and shipping name/city/postcode. "Which orders
contain this SKU?" — the question asked during a stock discrepancy or a product recall — has no
answer short of the CSV export.

---

## Controls that hold up

Verified during this pass; no action needed.

- **Status transitions are enforced server-side.** `assertOrderTransition` runs inside the action,
  not only in the UI, so a forged form cannot skip states.
- **Every mutation is audit-logged** with actor, IP, and correlation ID. Manual payment marking
  writes a distinct `ORDER_MARKED_PAID_MANUALLY` action, keeping it separable from Stripe-verified
  payments.
- **Payment confirmation is idempotent and single-sourced.** `confirmOrderPayment` returns `false`
  for an already-paid order; verified by re-running the simulator, which correctly declined to
  decrement stock twice.
- **The reservation cron is safe to re-run** — minute-bucketed `JobRun` idempotency key, plus a
  guarded `updateMany` so a concurrent pass cannot double-release.
- **Inventory uses optimistic locking** throughout: every write increments `version` and checks
  it, and checkout runs at `Serializable` isolation.
- **The Stripe webhook verifies signatures** against the raw body and dedupes on event ID before
  processing.
- **The customer order page compares tokens in constant time** with `timingSafeEqual`, enforces
  expiry, and returns an identical response for every failure mode — verified against four
  bad-token variants, zero PII in all four responses.
- **Refunds require re-authentication** and are validated against captured-minus-refunded before
  the Stripe call, even though the check needs the locking described in finding 05.

---

## Priority

| Order | Finding                               | Why now                                                                  |
| ----- | ------------------------------------- | ------------------------------------------------------------------------ |
| 1     | 01 — URL scheme validation            | One-line schema change; closes admin XSS and a customer phishing path    |
| 2     | 03 — 2FA for ORDER_MANAGER            | One-line policy change; the refund role is currently the unprotected one |
| 3     | 02 + 05 — refund ordering and locking | Same function; fix together before real money flows                      |
| 4     | 04 — restock on cancel/refund         | Silent inventory drift compounds daily once orders are live              |
| 5     | 06 — pagination controls              | Becomes a support problem at 26 orders                                   |
| 6     | 07, 08, 09, 10                        | Hardening; none blocks launch                                            |

---

## Scope and limits

**Covered** — order list, order detail, CSV export, `transitionOrderAction`, `addTrackingAction`,
`refundOrderAction`, the order state machine, `confirmOrderPayment`, order status notifications,
the Stripe webhook, the reservation cron, and the customer-facing confirmation page.

**Not covered** — product, inventory, wholesale, coupon, gift-box, and media administration; the
authentication implementation itself; and the Stripe account configuration. Findings 01–03 were
confirmed by executing the relevant code; the rest rest on source reading and schema inspection.

**Not a penetration test.** No attempt was made to bypass authentication, and no finding was
exploited end-to-end against a running instance.
