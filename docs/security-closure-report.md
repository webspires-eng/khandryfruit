# Pre-production security closure

Status as of 2026-07-16: repository controls strengthened; external Preview verification and operational configuration remain blocked.

## Implemented

- A per-request nonce is supplied to Next.js. A strict CSP with explicit Stripe, Sentry and approved Google Analytics origins, `script-src-attr 'none'`, `object-src 'none'`, `base-uri 'self'` and `frame-ancestors 'none'` runs in report-only mode. The compatibility policy remains enforced until Preview evidence permits `CSP_ENFORCE_STRICT=1`.
- Production rate limiting uses Upstash Redis sliding windows and fails closed on missing credentials or provider failure. Process memory is limited to development and tests. Authentication, contact, wholesale, gift-box creation, search and checkout are covered.
- Browser state-changing requests require an exact configured Origin. Server Actions pass through Proxy enforcement; auth and checkout route handlers also enforce Origin directly. Stripe webhooks remain protected by signature validation and cron remains bearer protected.
- Image uploads use checksum-bound quarantine keys. Finalisation performs magic-byte checks, bounded decoding, dimension/pixel checks, SVG/non-image rejection, malware scanning, metadata-stripping WebP re-encoding, random final keys and quarantine deletion.
- Better Auth TOTP and encrypted one-time recovery codes are available. ADMIN and SUPER_ADMIN access requires MFA in production, privileged sessions expire after 24 hours, and refunds, role changes, legal approval and business setting changes require a session created within 15 minutes. Privileged logins are audited and generate alerts; failed sign-ins are audited without submitted credentials. Other sessions can be revoked from the account page.
- Health checks distinguish CRITICAL, COMMERCE_BLOCKER, WARNING and OPTIONAL states. Optional analytics and warning-level Sentry configuration do not masquerade as core environment failures.
- Structured logs drop sensitive field names and values matching bearer tokens, database URLs, Stripe/AWS keys, JWTs and cookies. Synthetic redaction tests cover each pattern.
- Runtime and migration database responsibilities, credential rotation and pre-migration backups are documented separately.

## External controls still required

- Configure Upstash, malware scanner, private S3 bucket policy and narrowly scoped IAM permissions.
- Verify strict CSP and remove the compatibility `unsafe-inline` exception before commerce activation. Owner: production operator; deadline: commerce activation.
- Apply the MFA migration, enrol privileged users, store recovery codes offline, and test recovery/session revocation. Better Auth encrypts recovery codes at rest; a policy requiring irreversible hashing would need a separately reviewed recovery implementation and remains an accepted design gap.
- Create least-privilege Supabase runtime and migration roles and prove their grants. No credentials or grants were invented locally.
- Supply isolated Preview E2E customer, wholesale, order-manager, content-editor, admin and super-admin identities. Current repository variables cover customer/admin only; the additional role fixtures and destructive cleanup must be completed with the Preview database owner.
- Verify S3 scanning, CSP reports, login alerts and rate limits against real providers; run all gated Playwright tests on Vercel Preview.

## Launch recommendation

**NOT READY FOR LAUNCH.** Code-level controls are materially stronger, but production credentials, provider behavior, privileged-user enrolment, CSP enforcement evidence, database grants and complete Preview write-test evidence are mandatory before commerce activation.
