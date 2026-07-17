# Testing

`npm run test` runs Vitest unit tests for money, VAT, unit price, coupons, publication readiness, order transitions, gift-box capacity/pricing rules, wholesale/contact validation, search ranking and rate limiting. `npm run typecheck` generates Next.js route types before strict TypeScript.

There is no automated browser suite. Storefront, admin and checkout journeys are verified manually against a Preview deployment before promotion. Manual write checks must use isolated safe test data and must never target production customer records.

Before production, expand integration coverage against an isolated Supabase project for Better Auth registration/login, transaction contention, webhook replay, refund handling, admin mutations, CSV import, wholesale applications and privacy workflows. Run a complete Stripe test checkout and refund, keyboard-only journey, VoiceOver mobile Safari review, and physical-device checkout.
