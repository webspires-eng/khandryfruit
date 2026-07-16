import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { requireAdmin } from "@/server/policies/authorization";

export default async function SystemHealthPage() {
  await requireAdmin("system-health");
  let database = false;
  try { await db.$queryRaw`SELECT 1`; database = true; } catch { database = false; }
  const [latestJob, latestFailedJob] = database ? await Promise.all([
    db.jobRun.findFirst({ where: { status: "SUCCEEDED" }, orderBy: { completedAt: "desc" } }),
    db.jobRun.findFirst({ where: { status: "FAILED" }, orderBy: { completedAt: "desc" } }),
  ]) : [null, null];
  const checks = [
    ["Database connectivity", database], ["Stripe configuration", Boolean(env.STRIPE_SECRET_KEY)], ["Stripe webhook", Boolean(env.STRIPE_WEBHOOK_SECRET)], ["Email provider", Boolean(env.AWS_SES_FROM_EMAIL)], ["ADMIN_EMAIL", Boolean(env.ADMIN_EMAIL && env.ADMIN_EMAIL !== "orders@example.com")], ["Object storage", Boolean(env.AWS_S3_BUCKET && env.AWS_ACCESS_KEY_ID)],
  ] as const;
  return <div className="admin-page-v2"><div className="admin-page-heading"><div><p className="eyebrow">Super administrator</p><h1>System health</h1><p>Configuration presence and operational state. Credentials are never displayed.</p></div></div><section className="admin-card"><header><h2>Integrations</h2></header>{checks.map(([name, ok]) => <div className="admin-list-row" key={name}><strong>{name}</strong><span className="admin-status">{ok ? "Configured" : "Missing or invalid"}</span></div>)}</section><section className="admin-card"><header><h2>Runtime</h2></header><dl className="admin-summary"><dt>Environment</dt><dd>{env.NODE_ENV}</dd><dt>Application version</dt><dd>{process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? process.env.npm_package_version ?? "Unknown"}</dd><dt>Latest successful background job</dt><dd>{latestJob ? `${latestJob.jobName} · ${latestJob.completedAt?.toLocaleString("en-GB")}` : "No recorded run"}</dd><dt>Latest failed background job</dt><dd>{latestFailedJob ? `${latestFailedJob.jobName} · ${latestFailedJob.completedAt?.toLocaleString("en-GB")}` : "No recorded failure"}</dd></dl></section></div>;
}
