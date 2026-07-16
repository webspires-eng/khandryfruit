import { describe, expect, it } from "vitest";

import { env, productionEnvironmentIssues } from "./env";

const valid = {
  ...env,
  DATABASE_URL: "postgresql://runtime.invalid/db?sslmode=require",
  DIRECT_URL: "postgresql://direct.invalid/db?sslmode=verify-full",
  BETTER_AUTH_SECRET: "a-production-secret-with-at-least-32-characters",
  BETTER_AUTH_URL: "https://shop.example.test",
  NEXT_PUBLIC_SITE_URL: "https://shop.example.test",
  STRIPE_SECRET_KEY: "sk_live_example",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_example",
  STRIPE_WEBHOOK_SECRET: "whsec_example",
  ADMIN_EMAIL: "operations@example.test",
  AWS_REGION: "eu-central-1",
  AWS_ACCESS_KEY_ID: "example-access-id",
  AWS_SECRET_ACCESS_KEY: "example-secret-access-key",
  AWS_SES_FROM_EMAIL: "orders@example.test",
  AWS_S3_BUCKET: "example-production-bucket",
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "synthetic-upstash-token",
  MALWARE_SCAN_URL: "https://scanner.example.com/scan",
  MALWARE_SCAN_TOKEN: "synthetic-scanner-token",
  CRON_SECRET: "a-cron-secret-with-24-characters",
  SENTRY_DSN: "https://public@example.test/1",
  NEXT_PUBLIC_SENTRY_DSN: "https://public@example.test/1",
  GOOGLE_ANALYTICS_ID: "G-EXAMPLE",
  GOOGLE_SITE_VERIFICATION: "example-verification",
};

describe("production environment validation", () => {
  it("accepts a complete HTTPS, SSL and live-key configuration", () => {
    expect(productionEnvironmentIssues(valid)).toEqual([]);
  });

  it("rejects placeholders, test keys and connections without SSL", () => {
    const issues = productionEnvironmentIssues({
      ...valid,
      DATABASE_URL: "postgresql://runtime.invalid/db",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      STRIPE_SECRET_KEY: "sk_test_example",
      ADMIN_EMAIL: "orders@example.com",
    });
    expect(issues.map((issue) => issue.key)).toEqual(
      expect.arrayContaining([
        "DATABASE_URL",
        "NEXT_PUBLIC_SITE_URL",
        "STRIPE_SECRET_KEY",
        "ADMIN_EMAIL",
      ]),
    );
  });
});
