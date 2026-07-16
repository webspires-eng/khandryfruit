# Cloudflare R2 setup

The application uses Cloudflare R2 through its S3-compatible API. Do not paste Cloudflare credentials into chat, source files, screenshots, Git history or documentation.

## Create the bucket

1. Open Cloudflare Dashboard → R2 Object Storage.
2. Create a bucket such as `khan-dry-fruit-media` in the preferred jurisdiction.
3. Keep public writes disabled.
4. Configure a custom public media domain or an approved read-only delivery domain.
5. Add CORS only for the exact Preview and production origins and the required `PUT`/read headers.

## Create restricted credentials

Create an R2 API token with **Object Read & Write** access restricted to this bucket. The application needs read, write and delete access because uploads enter quarantine and rejected/quarantined objects must be removed. It does not need Cloudflare account administration, DNS or Workers permissions.

Cloudflare will show an Access Key ID and Secret Access Key once. Store them directly in local `.env` and protected Vercel environment variables:

```text
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=khan-dry-fruit-media
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL=https://media.example.com
```

Only the public delivery URL may use the `NEXT_PUBLIC_` prefix. Never expose the R2 access key or secret key to browser code.

## Required bucket behavior

- Deny anonymous and public writes.
- Permit the application token only on the selected bucket.
- Keep `quarantine/` objects private and outside public delivery rules.
- Publish only validated final keys under `products/`, `gift-boxes/`, `certificates/` or `content/`.
- Apply lifecycle deletion to abandoned `quarantine/` objects after an agreed short retention period.
- Enable audit logs, object retention/versioning and an independent media backup according to the recovery policy.

No live Cloudflare changes have been made from this workspace. Add the credentials locally when ready; do not send them through chat.
