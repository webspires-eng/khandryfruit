import { describe, expect, it } from "vitest";

import {
  env,
  isPlaceholderValue,
  productionEnvironmentIssues,
  stripeWebhookReady,
} from "./env";

const valid = {
  ...env,
  DATABASE_URL: "postgresql://runtime.invalid/db?sslmode=require",
  DIRECT_URL: "postgresql://direct.invalid/db?sslmode=verify-full",
  BETTER_AUTH_SECRET: "a-production-secret-with-at-least-32-characters",
  BETTER_AUTH_URL: "https://shop.example.test",
  NEXT_PUBLIC_SITE_URL: "https://shop.example.test",
  STRIPE_SECRET_KEY: "sk_live_example",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_example",
  STRIPE_WEBHOOK_SECRET: "whsec_" + "0123456789abcdef".repeat(2),
  ADMIN_EMAIL: "operations@example.test",
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: 587,
  SMTP_USER: "orders@example.test",
  SMTP_PASSWORD: "synthetic-app-password",
  SMTP_FROM_EMAIL: "orders@example.test",
  CLOUDFLARE_R2_ACCOUNT_ID: "example-account-id",
  CLOUDFLARE_R2_ACCESS_KEY_ID: "example-r2-access-id",
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: "example-r2-secret",
  CLOUDFLARE_R2_BUCKET: "example-production-bucket",
  NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL: "https://media.example.test",
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
      SMTP_FROM_EMAIL: "orders@example.com",
    });
    expect(issues.map((issue) => issue.key)).toEqual(
      expect.arrayContaining([
        "DATABASE_URL",
        "NEXT_PUBLIC_SITE_URL",
        "STRIPE_SECRET_KEY",
        "ADMIN_EMAIL",
        "SMTP_FROM_EMAIL",
      ]),
    );
  });

  it("reports missing SMTP credentials as launch blockers", () => {
    const issues = productionEnvironmentIssues({
      ...valid,
      SMTP_HOST: undefined,
      SMTP_USER: undefined,
      SMTP_PASSWORD: undefined,
      SMTP_FROM_EMAIL: "",
    });
    expect(issues.map((issue) => issue.key)).toEqual(
      expect.arrayContaining([
        "SMTP_HOST",
        "SMTP_USER",
        "SMTP_PASSWORD",
        "SMTP_FROM_EMAIL",
      ]),
    );
  });
});

describe("stripe webhook readiness", () => {
  it("rejects the placeholder copied from .env.example", () => {
    // This exact value was live and every readiness check reported it green.
    expect(
      stripeWebhookReady({
        ...valid,
        STRIPE_WEBHOOK_SECRET: "whsec_replace_me",
      }),
    ).toBe(false);
  });

  it("rejects missing, malformed and too-short secrets", () => {
    for (const secret of [undefined, "", "sk_live_abc", "whsec_short"])
      expect(
        stripeWebhookReady({ ...valid, STRIPE_WEBHOOK_SECRET: secret }),
        String(secret),
      ).toBe(false);
  });

  it("accepts a real Stripe signing secret", () => {
    expect(
      stripeWebhookReady({
        ...valid,
        STRIPE_WEBHOOK_SECRET: "whsec_" + "a".repeat(32),
      }),
    ).toBe(true);
  });

  it("flags a placeholder secret as a production blocker", () => {
    const issues = productionEnvironmentIssues({
      ...valid,
      STRIPE_WEBHOOK_SECRET: "whsec_replace_me",
    });
    expect(issues.map((issue) => issue.key)).toContain("STRIPE_WEBHOOK_SECRET");
  });

  it("detects placeholder values generally", () => {
    for (const value of ["replace-me", "CHANGEME", "your-token", undefined])
      expect(isPlaceholderValue(value), String(value)).toBe(true);
    expect(isPlaceholderValue("whsec_" + "a".repeat(32))).toBe(false);
  });
});
