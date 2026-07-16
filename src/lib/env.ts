import { z } from "zod";

const optionalUrl = z.string().url().optional().or(z.literal(""));

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: optionalUrl,
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_URL: optionalUrl,
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  AWS_REGION: z.string().default("eu-central-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_ENDPOINT: optionalUrl,
  AWS_SES_FROM_EMAIL: z.string().email().optional().or(z.literal("")),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.enum(["de", "en"]).default("de"),
  ADMIN_EMAIL: z.string().email().default("orders@example.com"),
  WHATSAPP_NUMBER: z
    .string()
    .regex(/^\d{8,15}$/)
    .default("4917621809185"),
  CRON_SECRET: z.string().min(24).optional(),
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),
  GOOGLE_SITE_VERIFICATION: z.string().optional(),
  META_PIXEL_ID: z.string().optional(),
  TIKTOK_PIXEL_ID: z.string().optional(),
  SENTRY_DSN: optionalUrl,
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  CSP_ENFORCE_STRICT: z.enum(["0", "1"]).default("0"),
  MALWARE_SCAN_URL: optionalUrl,
  MALWARE_SCAN_TOKEN: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Invalid environment configuration: ${z.prettifyError(parsed.error)}`,
  );
}

export const env = {
  ...parsed.data,
  BETTER_AUTH_SECRET: parsed.data.AUTH_SECRET ?? parsed.data.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: parsed.data.AUTH_URL ?? parsed.data.BETTER_AUTH_URL,
  GOOGLE_ANALYTICS_ID:
    parsed.data.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ??
    parsed.data.GOOGLE_ANALYTICS_ID,
};

export type ProductionEnvironmentIssue = {
  key: string;
  reason: string;
};

function hasSsl(url: string | undefined) {
  if (!url) return false;
  try {
    const mode = new URL(url).searchParams.get("sslmode");
    return mode === "require" || mode === "verify-full";
  } catch {
    return false;
  }
}

export function productionEnvironmentIssues(
  source: typeof env = env,
): ProductionEnvironmentIssue[] {
  const issues: ProductionEnvironmentIssue[] = [];
  const required = [
    ["DATABASE_URL", source.DATABASE_URL],
    ["DIRECT_URL", source.DIRECT_URL],
    ["AUTH_SECRET", source.BETTER_AUTH_SECRET],
    ["AUTH_URL", source.BETTER_AUTH_URL],
    ["NEXT_PUBLIC_SITE_URL", source.NEXT_PUBLIC_SITE_URL],
    ["STRIPE_SECRET_KEY", source.STRIPE_SECRET_KEY],
    [
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      source.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    ],
    ["STRIPE_WEBHOOK_SECRET", source.STRIPE_WEBHOOK_SECRET],
    ["ADMIN_EMAIL", source.ADMIN_EMAIL],
    ["AWS_REGION", source.AWS_REGION],
    ["AWS_ACCESS_KEY_ID", source.AWS_ACCESS_KEY_ID],
    ["AWS_SECRET_ACCESS_KEY", source.AWS_SECRET_ACCESS_KEY],
    ["AWS_SES_FROM_EMAIL", source.AWS_SES_FROM_EMAIL],
    ["AWS_S3_BUCKET", source.AWS_S3_BUCKET],
    ["CRON_SECRET", source.CRON_SECRET],
    ["UPSTASH_REDIS_REST_URL", source.UPSTASH_REDIS_REST_URL],
    ["UPSTASH_REDIS_REST_TOKEN", source.UPSTASH_REDIS_REST_TOKEN],
    ["MALWARE_SCAN_URL", source.MALWARE_SCAN_URL],
    ["MALWARE_SCAN_TOKEN", source.MALWARE_SCAN_TOKEN],
  ] as const;
  for (const [key, value] of required)
    if (!value) issues.push({ key, reason: "missing" });

  if (source.DATABASE_URL && !hasSsl(source.DATABASE_URL))
    issues.push({
      key: "DATABASE_URL",
      reason: "sslmode=require or verify-full is required",
    });
  if (source.DIRECT_URL && !hasSsl(source.DIRECT_URL))
    issues.push({
      key: "DIRECT_URL",
      reason: "sslmode=require or verify-full is required",
    });
  if (!source.NEXT_PUBLIC_SITE_URL.startsWith("https://"))
    issues.push({ key: "NEXT_PUBLIC_SITE_URL", reason: "must use HTTPS" });
  if (source.BETTER_AUTH_URL && !source.BETTER_AUTH_URL.startsWith("https://"))
    issues.push({ key: "AUTH_URL", reason: "must use HTTPS" });
  if (
    source.STRIPE_SECRET_KEY &&
    !source.STRIPE_SECRET_KEY.startsWith("sk_live_")
  )
    issues.push({ key: "STRIPE_SECRET_KEY", reason: "must be a live key" });
  if (
    source.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    !source.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith("pk_live_")
  )
    issues.push({
      key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      reason: "must be a live key",
    });
  if (
    source.ADMIN_EMAIL === "orders@example.com" ||
    source.ADMIN_EMAIL.endsWith("@example.com")
  )
    issues.push({
      key: "ADMIN_EMAIL",
      reason: "placeholder addresses are forbidden",
    });
  if (source.AWS_SES_FROM_EMAIL?.endsWith("@example.com"))
    issues.push({
      key: "AWS_SES_FROM_EMAIL",
      reason: "placeholder addresses are forbidden",
    });
  return issues;
}

export function assertProductionEnvironment() {
  if (env.NODE_ENV !== "production") return;
  const issues = productionEnvironmentIssues();
  if (issues.length)
    throw new Error(
      `Production environment is not launch-safe: ${issues
        .map(({ key, reason }) => `${key} (${reason})`)
        .join(", ")}`,
    );
}
