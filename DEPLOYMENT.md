# Vercel + Supabase deployment

1. Create a Supabase project in an EU region and record the transaction pooler and direct connection URLs.
2. In Vercel, import the repository and select Next.js. Set Node.js 22.
3. Add every variable from `.env.example`; use the pooled URL for `DATABASE_URL` and direct URL for `DIRECT_URL`.
4. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to the production HTTPS domain. Generate independent `BETTER_AUTH_SECRET` and `CRON_SECRET` values.
5. From a trusted CI/deployment environment run `npm ci`, `npm run db:generate`, `npm run db:deploy`, and optionally the development seed only in a non-production database.
6. Configure Stripe webhook URL `https://DOMAIN/api/stripe/webhook` for the five implemented event families and copy its signing secret.
7. Configure the verified email domain, SPF, DKIM and DMARC before setting `AWS_SES_FROM_EMAIL`.
8. Configure S3-compatible media credentials or implement the provided `StorageProvider` using Supabase Storage.
9. Vercel Cron calls `/api/cron/reservations` daily at 03:00 UTC on the Hobby plan; Vercel sends `CRON_SECRET` as a Bearer token. Use a Pro plan or an external scheduler if reservation cleanup must run more frequently.
10. Run the launch checklist. Promote to production only after legal and commerce blockers pass.

## Backups and recovery

Enable Supabase daily backups and point-in-time recovery appropriate to the plan. Target RPO is 24 hours without PITR and 15 minutes with PITR; target RTO is four hours until the owner approves stricter objectives. Keep media versioning/backups in the storage provider. Test a database restore into an isolated project every quarter, validate row counts and a sample checkout/order, rotate restored secrets, and document the responsible operator.

Production deployment requires explicit approval in Vercel. Preview uses separate Stripe test keys and preferably a separate Supabase project or schema.
