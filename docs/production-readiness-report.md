# Production readiness report

Generated from the local environment on 2026-07-16. This is a preparation report, not a launch approval.

## Verified locally

- Prisma schema valid; two local migrations are applied and the PostgreSQL 5433 schema is current.
- Strict TypeScript and ESLint pass.
- 70 Vitest tests pass.
- Production compilation succeeds when supplied a complete synthetic validation environment; no real production credentials were used.
- Playwright: 12 read-only checks pass. Five authenticated/write checks are safely skipped until dedicated E2E identities and write opt-in are supplied.
- Stripe webhook code verifies the raw-body signature, persists event IDs, blocks processed duplicates, and marks payment only from verified paid webhook data.
- Security headers include CSP, HSTS, frame denial, MIME protection, referrer policy and restricted browser permissions.

## Current environment blockers

The local environment is rejected for production because Stripe live keys/webhook, AWS credentials/sender/bucket, Sentry, public analytics ID and Google verification are missing; database URLs do not declare production SSL; site/auth URLs are HTTP; and `ADMIN_EMAIL` is a placeholder.

Supabase production connectivity, production migration deployment, live Stripe webhook delivery, live payment/refunds, SMTP delivery, DNS verification, Vercel deployment, Sentry ingestion, and backup/PITR availability have not been verified because the corresponding external systems are not configured.

## Dependency audit

`npm audit --omit=dev` initially reported eight moderate entries. A scoped override updated Prisma's transitive `@hono/node-server` from `1.19.11` to patched `1.19.13`, reducing the audit to five moderate entries. The remaining entries all propagate from Next's pinned PostCSS `8.4.31`; the application does not accept or stringify user-authored CSS, so reachability is low, but the risk remains tracked. npm's offered automatic resolution is a breaking downgrade and was not applied. See the [security dependency risk register](./security-risk-register.md) and recheck upstream Prisma/Next releases before launch.

## Local response sample

Measured against the local development server, so these values are diagnostic only and are not production Core Web Vitals:

| Route                           | HTTP |        TTFB |
| ------------------------------- | ---: | ----------: |
| `/en`                           |  200 | 4.61 s cold |
| `/en/shop`                      |  200 |      1.20 s |
| `/en/product/black-raisins`     |  200 |      1.73 s |
| `/en/search?q=raisins`          |  200 |      1.00 s |
| `/en/gift-boxes/build-your-own` |  200 |      0.95 s |
| `/en/cart`                      |  200 |      0.41 s |
| `/en/checkout`                  |  200 |      0.40 s |

The isolated build output was approximately 62 MB, with approximately 1.1 MB of emitted top-level JavaScript chunks before compression and route-specific loading. Run Vercel Speed Insights or an approved RUM/Lighthouse process on Preview to collect LCP, INP, CLS, hydration errors, query counts and production server timings. Do not use these development timings as an SLO.

## Client information still required

- Confirmed registered/trading address, opening hours and public business email.
- Confirmed VAT treatment from the appropriate adviser.
- LUCID and food-business registration status.
- Approved Impressum, privacy, terms, withdrawal, returns and shipping content.
- Approved shipping zones/rates.
- At least one fully verified product with food labelling and claims evidence.
- Production domain/DNS owner, recovery owner, RPO/RTO, Supabase plan/backup retention, SMTP sending-domain owner, Stripe account owner and Sentry organisation.

## Launch decision

**Blocked.** Do not publish products or promote the Vercel deployment until every item in `/admin/system-health` is ready and the external evidence listed in the deployment runbook has been archived.
