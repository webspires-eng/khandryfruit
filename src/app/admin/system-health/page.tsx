import { db } from "@/lib/db/client";
import { env, stripeWebhookReady } from "@/lib/env";
import { requireAdmin } from "@/server/policies/authorization";
import { getLaunchReadiness } from "@/server/services/launch-readiness";

export default async function SystemHealthPage() {
  await requireAdmin("system-health");
  let database = false;
  try {
    await db.$queryRaw`SELECT 1`;
    database = true;
  } catch {
    database = false;
  }
  const [latestJob, latestFailedJob, launch] = database
    ? await Promise.all([
        db.jobRun.findFirst({
          where: { status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
        }),
        db.jobRun.findFirst({
          where: { status: "FAILED" },
          orderBy: { completedAt: "desc" },
        }),
        getLaunchReadiness(),
      ])
    : [null, null, null];
  const checks = [
    ["Database connectivity", database, "CRITICAL"],
    [
      "Stripe configuration",
      Boolean(env.STRIPE_SECRET_KEY),
      "COMMERCE_BLOCKER",
    ],
    ["Stripe webhook", stripeWebhookReady(), "COMMERCE_BLOCKER"],
    [
      "Email provider (SMTP)",
      Boolean(env.SMTP_HOST && env.SMTP_FROM_EMAIL),
      "COMMERCE_BLOCKER",
    ],
    [
      "ADMIN_EMAIL",
      Boolean(env.ADMIN_EMAIL && env.ADMIN_EMAIL !== "orders@example.com"),
      "COMMERCE_BLOCKER",
    ],
    [
      "Cloudflare R2 storage",
      Boolean(env.CLOUDFLARE_R2_BUCKET && env.CLOUDFLARE_R2_ACCESS_KEY_ID),
      "COMMERCE_BLOCKER",
    ],
    [
      "Distributed rate limiter",
      Boolean(env.UPSTASH_REDIS_REST_URL),
      "CRITICAL",
    ],
    [
      "Sentry",
      Boolean(env.SENTRY_DSN && env.NEXT_PUBLIC_SENTRY_DSN),
      "WARNING",
    ],
    ["Analytics", Boolean(env.GOOGLE_ANALYTICS_ID), "OPTIONAL"],
  ] as const;
  return (
    <div className="admin-page-v2">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Super administrator</p>
          <h1>System health</h1>
          <p>
            Configuration presence and operational state. Credentials are never
            displayed.
          </p>
        </div>
      </div>
      <section className="admin-card">
        <header>
          <h2>Launch readiness</h2>
          <span
            className={`admin-status ${launch?.ready ? "is-positive" : "is-negative"}`}
          >
            {launch?.ready
              ? "Ready"
              : `${launch?.blockerCount ?? "—"} blockers`}
          </span>
        </header>
        {launch?.checks.map((check) => (
          <div className="admin-list-row" key={check.key}>
            <span>
              <strong>{check.label}</strong>
              <small>
                {check.severity} · {check.detail}
              </small>
            </span>
            <span
              className={`admin-status ${check.ready ? "is-positive" : "is-negative"}`}
            >
              {check.ready ? "Ready" : "Blocked"}
            </span>
          </div>
        )) ?? (
          <p className="admin-empty">
            Database unavailable; readiness cannot be evaluated.
          </p>
        )}
      </section>
      <section className="admin-card">
        <header>
          <h2>Integrations</h2>
        </header>
        {checks.map(([name, ok, severity]) => (
          <div className="admin-list-row" key={name}>
            <span>
              <strong>{name}</strong>
              <small>{severity}</small>
            </span>
            <span
              className={`admin-status ${ok ? "is-positive" : severity === "WARNING" || severity === "OPTIONAL" ? "is-warning" : "is-negative"}`}
            >
              {ok ? "Configured" : "Missing or invalid"}
            </span>
          </div>
        ))}
      </section>
      <section className="admin-card">
        <header>
          <h2>Runtime</h2>
        </header>
        <dl className="admin-summary">
          <dt>Environment</dt>
          <dd>{env.NODE_ENV}</dd>
          <dt>Application version</dt>
          <dd>
            {process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
              process.env.npm_package_version ??
              "Unknown"}
          </dd>
          <dt>Latest successful background job</dt>
          <dd>
            {latestJob
              ? `${latestJob.jobName} · ${latestJob.completedAt?.toLocaleString("en-GB")}`
              : "No recorded run"}
          </dd>
          <dt>Latest failed background job</dt>
          <dd>
            {latestFailedJob
              ? `${latestFailedJob.jobName} · ${latestFailedJob.completedAt?.toLocaleString("en-GB")}`
              : "No recorded failure"}
          </dd>
        </dl>
      </section>
    </div>
  );
}
