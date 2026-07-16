# Testing

`npm run test` runs Vitest unit tests for money, VAT, unit price, coupons, publication readiness, order transitions, gift-box capacity/pricing rules, wholesale/contact validation, search ranking and rate limiting. `npm run typecheck` generates Next.js route types before strict TypeScript.

`npm run test:e2e` runs the non-destructive Playwright smoke suite against local by default or `PLAYWRIGHT_BASE_URL`. Write flows must use isolated safe test data and must never target production unless the test explicitly opts into a reversible production-safe scenario.

Preview write tests require dedicated disposable identities and `E2E_WRITE_ENABLED=true`. Never point them at production customer records. The suite must clean up records after each enabled run; authenticated and write-gated skips are not acceptable for final Preview approval.

Before production, expand integration coverage against an isolated Supabase project for Better Auth registration/login, transaction contention, webhook replay, refund handling, admin mutations, CSV import, wholesale applications and privacy workflows. Run a complete Stripe test checkout and refund, keyboard-only journey, VoiceOver mobile Safari review, and physical-device checkout.
