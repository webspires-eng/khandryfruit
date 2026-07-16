# Vercel + Supabase deployment

1. Create a Supabase project in an EU region and record the transaction pooler and direct connection URLs.
2. In Vercel, import the repository and select Next.js. Set Node.js 22.
3. Add every variable from `.env.example`; use the pooled URL for `DATABASE_URL` and direct URL for `DIRECT_URL`.
4. Set `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the production HTTPS domain. Generate independent `AUTH_SECRET` and `CRON_SECRET` values.
5. From one trusted CI/deployment environment run `npm ci`, `npm run db:validate`, `npm run db:status`, `npm run db:deploy`, and—only when explicitly approved—`ALLOW_PRODUCTION_SEED=required-settings npm run db:seed:production`. Never run the development seed in production.
6. Configure Stripe webhook URL `https://DOMAIN/api/stripe/webhook` for the five implemented event families and copy its signing secret.
7. Configure the verified email domain, SPF, DKIM and DMARC before setting `AWS_SES_FROM_EMAIL`.
8. Create the private Cloudflare R2 bucket and restricted application token described in `docs/cloudflare-r2-setup.md`, then configure its protected environment variables and read-only public media URL.
9. Vercel Cron calls `/api/cron/reservations` every 15 minutes and sends `CRON_SECRET` as a Bearer token. This requires a Vercel plan that supports the schedule; otherwise use an external scheduler with the same authorization header.
10. Run the launch checklist. Promote to production only after legal and commerce blockers pass.

## Backups and recovery

Enable Supabase daily backups and point-in-time recovery appropriate to the plan. Target RPO is 24 hours without PITR and 15 minutes with PITR; target RTO is four hours until the owner approves stricter objectives. Keep media versioning/backups in the storage provider. Test a database restore into an isolated project every quarter, validate row counts and a sample checkout/order, rotate restored secrets, and document the responsible operator.

Production deployment requires explicit approval in Vercel. Preview uses separate Stripe test keys and preferably a separate Supabase project or schema.

See `docs/production-deployment.md` for the authoritative environment, Stripe, SES, migration, recovery, evidence and rollback procedure.
