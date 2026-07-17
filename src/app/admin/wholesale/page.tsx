import Link from "next/link";
import type { Route } from "next";
import { ArrowUpRight } from "lucide-react";
import { db } from "@/lib/db/client";
import { requireAdmin } from "@/server/policies/authorization";
import {
  humanise,
  statusLabel,
  statusTone,
  wholesaleDateFormat,
  wholesaleStatuses,
} from "./status";

export default async function WholesalePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin("wholesale");
  const { status = "" } = await searchParams;
  const active = (wholesaleStatuses as readonly string[]).includes(status)
    ? status
    : "";

  const [applications, grouped] = await Promise.all([
    db.wholesaleApplication.findMany({
      where: active ? { status: active as never } : undefined,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.wholesaleApplication.groupBy({ by: ["status"], _count: true }),
  ]);
  const counts = new Map(grouped.map((g) => [String(g.status), g._count]));
  const total = grouped.reduce((sum, g) => sum + g._count, 0);
  const awaiting =
    (counts.get("SUBMITTED") ?? 0) +
    (counts.get("UNDER_REVIEW") ?? 0) +
    (counts.get("MORE_INFORMATION_REQUIRED") ?? 0);

  const filters = [
    { value: "", label: "All", count: total },
    ...wholesaleStatuses.map((s) => ({
      value: s as string,
      label: statusLabel[s],
      count: counts.get(s) ?? 0,
    })),
  ];

  return (
    <div className="admin-page-v2">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Trade accounts</p>
          <h1>Wholesale applications</h1>
          <p>
            {awaiting > 0
              ? `${awaiting} application${awaiting === 1 ? "" : "s"} awaiting a decision.`
              : "No applications are waiting on you."}{" "}
            Open an application to review it and record a decision.
          </p>
        </div>
      </div>

      <nav className="admin-tabs" aria-label="Filter by status">
        {filters.map((filter) => (
          <Link
            key={filter.value || "all"}
            href={
              (filter.value
                ? `/admin/wholesale?status=${filter.value}`
                : "/admin/wholesale") as Route
            }
            className={filter.value === active ? "active" : ""}
            aria-current={filter.value === active ? "page" : undefined}
          >
            <span>{filter.label}</span>
            <b className="admin-tab-count">{filter.count}</b>
          </Link>
        ))}
      </nav>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Contact</th>
              <th>Business</th>
              <th>Volume</th>
              <th>Status</th>
              <th>Applied</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>
                  <Link
                    className="admin-row-link"
                    href={`/admin/wholesale/${app.id}` as Route}
                  >
                    {app.companyName}
                  </Link>
                  <small>{app.email}</small>
                </td>
                <td>
                  {app.contactName}
                  <small>{app.phone}</small>
                </td>
                <td>{humanise(app.businessType)}</td>
                <td>{humanise(app.monthlyOrderVolume)}</td>
                <td>
                  <span
                    className={`admin-status ${statusTone[app.status] ?? ""}`}
                  >
                    {statusLabel[app.status] ?? app.status}
                  </span>
                </td>
                <td>{wholesaleDateFormat.format(app.createdAt)}</td>
                <td>
                  <Link
                    className="table-action"
                    href={`/admin/wholesale/${app.id}` as Route}
                  >
                    Review <ArrowUpRight size={13} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!applications.length && (
          <p className="admin-empty">
            {active
              ? `No applications with status “${statusLabel[active] ?? active}”.`
              : "No wholesale applications yet."}
          </p>
        )}
      </div>
    </div>
  );
}
