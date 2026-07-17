# Khan Dry Fruit ecommerce

A bilingual German/English Next.js 16 commerce application for Khan Dry Fruit. It uses Prisma 7 with PostgreSQL, Better Auth, Stripe Checkout, server-validated cart calculations, transaction-safe stock reservations, a feature-oriented App Router structure, and provider abstractions for storage, email and shipping.

The application is deliberately not marked production-ready. Legal text, business registration/address, VAT status, LUCID and food-business registration, live product food data, shipping contracts/rates, production imagery and live integration credentials are launch blockers.

## Local storefront

```bash
npm install
npm run db:generate
npm run dev
```

Open `http://localhost:3000` (redirects to `/de`). Without `DATABASE_URL`, the storefront uses clearly labelled development catalogue data; authentication, checkout and admin writes remain disabled.

## Supabase setup

Create a Supabase project and copy:

- transaction-pooler URL to `DATABASE_URL` for Vercel runtime requests;
- direct/session connection URL to `DIRECT_URL` for Prisma migrations.

Then:

```bash
npm run db:deploy
npm run db:seed
npm run dev
```

Local seed accounts use `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_CUSTOMER_EMAIL` and `SEED_CUSTOMER_PASSWORD`. They are development-only. Change/remove them before staging or production.

## Administration

`npm run db:seed` creates or updates the development administrator identified by `SEED_ADMIN_EMAIL` and assigns `SUPER_ADMIN`. Keep the password only in the ignored local environment file. Sign in through `/en/sign-in` or `/de/sign-in`, then open `/admin`; locale-prefixed `/en/admin/...` and `/de/admin/...` URLs redirect to the single protected admin namespace.

Routes cover dashboard, products, categories, inventory, orders, customers, wholesale applications, contact enquiries, gift boxes, packaging, coupons, reviews, bilingual content, blog, recipes, FAQs, legal content, settings, audit logs and system health. Every page and mutation rechecks permissions on the server. `CONTENT_EDITOR` is limited to publishing areas, `ORDER_MANAGER` to orders/customers/contact enquiries, `ADMIN` to day-to-day commerce and business settings, and `SUPER_ADMIN` additionally controls roles, audit logs and system health.

The initial migration defines the commerce/auth domain. `20260715230000_admin_dashboard_fields` adds admin-required variant ordering, inventory notes, wholesale review fields, gift-box configuration records and search aliases. Apply migrations with `npm run db:deploy` before seeding.

## Localisation policy

German (`de`) is the default locale and all public storefront routes are locale-prefixed. Interface copy is stored in `messages/de.json` and `messages/en.json`; missing next-intl keys fail visibly during development.

Product and legal content never falls back across languages. Public product queries require the exact locale translation and exclude incomplete locale records in production. Category and CMS fallback must be explicitly implemented and documented before use; there is no implicit fallback today. Development previews use locale-specific placeholder copy and remain `noindex`.

Audit existing development data without making changes:

```bash
npm run db:audit-localisation
```

After reviewing the JSON report, apply only the script's exact known-placeholder repairs with `npm run db:repair-localisation`. Free-form descriptions flagged under `manualReview` are never overwritten automatically.

## Better Auth on Vercel + Supabase

Better Auth—not Supabase Auth—is the authentication authority. It stores `user`, `session`, `account` and `verification` tables in Supabase PostgreSQL. Set these Vercel variables:

```text
DATABASE_URL=<Supabase transaction pooler URL>
DIRECT_URL=<Supabase direct/session URL>
AUTH_SECRET=<openssl rand -base64 32>
AUTH_URL=https://your-domain.example
NEXT_PUBLIC_SITE_URL=https://your-domain.example
```

Do not enable a second Supabase Auth login flow. Add each Vercel preview/production URL to Better Auth trusted origins when preview authentication is required; production should use the final HTTPS domain. Cookies become secure automatically in production. Admin access requires a server-side role of `CONTENT_EDITOR`, `ORDER_MANAGER`, `ADMIN` or `SUPER_ADMIN`.

## Stripe test flow

Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_WEBHOOK_SECRET`. Forward events locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use Stripe test card `4242 4242 4242 4242`, a future expiry and any CVC. Checkout refuses draft products. A product must pass food-data publication validation and be changed to `ACTIVE` before Stripe checkout. Payment is confirmed only by signed, idempotent webhooks.

## Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
```

See `DEPLOYMENT.md`, `SECURITY.md` and `TESTING.md`.

The controlled production procedure and rollback checklist are in [`docs/production-deployment.md`](docs/production-deployment.md). Production migrations and seeds are deliberately excluded from the Vercel build command.
