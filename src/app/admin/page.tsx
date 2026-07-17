import Link from "next/link";
import type { Route } from "next";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  PackageCheck,
  Plus,
  Star,
  Store,
  Users,
  Warehouse,
} from "lucide-react";
import { db } from "@/lib/db/client";
import { formatMoney } from "@/lib/commerce/money";
import { countBlockedProducts } from "@/server/services/product-readiness";
import { canAccessAdmin } from "@/config/admin";
import { requireAdmin } from "@/server/policies/authorization";

export default async function AdminPage() {
  const session = await requireAdmin("dashboard");
  const role = String(session.user.role);
  const [
    paidTotals,
    paidOrders,
    pendingOrders,
    customers,
    applications,
    inventory,
    drafts,
    pendingReviews,
    recentOrders,
    recentApplications,
    adjustments,
    audits,
    bestsellers,
    blocked,
  ] = await Promise.all([
    db.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { totalCents: true },
      _avg: { totalCents: true },
    }),
    db.order.count({ where: { paymentStatus: "PAID" } }),
    db.order.count({
      where: { status: { in: ["PENDING_PAYMENT", "PAYMENT_FAILED"] } },
    }),
    db.user.count({
      where: { role: { in: ["CUSTOMER", "WHOLESALE_CUSTOMER"] } },
    }),
    db.wholesaleApplication.count({
      where: {
        status: {
          in: ["SUBMITTED", "UNDER_REVIEW", "MORE_INFORMATION_REQUIRED"],
        },
      },
    }),
    db.inventory.findMany({
      include: {
        variant: {
          include: {
            product: { include: { translations: { where: { locale: "de" } } } },
          },
        },
      },
    }),
    db.product.count({ where: { status: "DRAFT", deletedAt: null } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    db.wholesaleApplication.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    db.inventoryAdjustment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        inventory: {
          include: {
            variant: {
              include: {
                product: {
                  include: { translations: { where: { locale: "de" } } },
                },
              },
            },
          },
        },
      },
    }),
    canAccessAdmin(role, "audit-logs")
      ? db.auditLog.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          include: { actor: true },
        })
      : Promise.resolve([]),
    db.orderItem.groupBy({
      by: ["productId", "productName"],
      _sum: { quantity: true, lineTotalCents: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    countBlockedProducts(),
  ]);
  const lowStock = inventory.filter(
    (item) => item.onHand - item.reserved <= item.lowStockThreshold,
  );
  // Headline commercial numbers only. Anything that needs an operator to act
  // lives in "Needs attention" below, where it is a link rather than a tile.
  const metrics = [
    [
      "Revenue",
      formatMoney(paidTotals._sum.totalCents ?? 0, "en"),
      CircleDollarSign,
    ],
    ["Paid orders", paidOrders, PackageCheck],
    [
      "Average order",
      formatMoney(Math.round(paidTotals._avg.totalCents ?? 0), "en"),
      CircleDollarSign,
    ],
    ["Customers", customers, Users],
  ] as const;

  const attention = [
    {
      area: "orders",
      count: pendingOrders,
      label: "Orders awaiting payment",
      detail: "Pending or failed payment checks.",
      href: "/admin/orders",
      icon: ClipboardList,
      urgent: true,
    },
    {
      area: "inventory",
      count: lowStock.length,
      label: "Low-stock variants",
      detail: "At or below their stock threshold.",
      href: "/admin/inventory",
      icon: Warehouse,
      urgent: true,
    },
    {
      area: "products",
      count: blocked,
      label: "Products blocked from publishing",
      detail: "Missing required data before they can go live.",
      href: "/admin/products",
      icon: AlertTriangle,
      urgent: true,
    },
    {
      area: "wholesale",
      count: applications,
      label: "Wholesale applications",
      detail: "Waiting on a decision.",
      href: "/admin/wholesale",
      icon: Store,
      urgent: false,
    },
    {
      area: "reviews",
      count: pendingReviews,
      label: "Reviews to moderate",
      detail: "Submitted and awaiting approval.",
      href: "/admin/reviews",
      icon: Star,
      urgent: false,
    },
    {
      area: "products",
      count: drafts,
      label: "Draft products",
      detail: "Not yet published to the storefront.",
      href: "/admin/products",
      icon: Boxes,
      urgent: false,
    },
  ].filter((item) => item.count > 0 && canAccessAdmin(role, item.area as never));

  return (
    <div className="admin-page-v2">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Store overview</p>
          <h1>Dashboard</h1>
          <p>
            Live operational data from the connected database. No estimated
            analytics are shown.
          </p>
        </div>
        <div className="admin-heading-actions">
          {canAccessAdmin(role, "products") && (
            <Link className="button" href="/admin/products/new">
              <Plus size={15} /> New product
            </Link>
          )}
        </div>
      </div>

      <div className="admin-metric-grid">
        {metrics.map(([label, value, Icon]) => (
          <section key={label}>
            <span className="metric-icon">
              <Icon size={19} />
            </span>
            <small>{label}</small>
            <strong>{value}</strong>
          </section>
        ))}
      </div>

      <section className="admin-card">
        <header>
          <h2>Needs attention</h2>
          <span
            className={`admin-status ${attention.length ? "is-warning" : "is-positive"}`}
          >
            {attention.length ? `${attention.length} to review` : "All clear"}
          </span>
        </header>
        {attention.length ? (
          attention.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="admin-attention-row"
                href={item.href as Route}
                key={item.label}
              >
                <span
                  className={`admin-attention-icon ${item.urgent ? "is-urgent" : ""}`}
                >
                  <Icon size={16} />
                </span>
                <span className="admin-attention-copy">
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
                <b className="admin-attention-count">{item.count}</b>
                <ArrowUpRight size={15} />
              </Link>
            );
          })
        ) : (
          <p className="admin-empty">
            Nothing needs action right now. Orders, stock, publishing and
            customer requests are all up to date.
          </p>
        )}
      </section>
      <div className="admin-dashboard-grid">
        <AdminTable
          title="Recent orders"
          href="/admin/orders"
          empty="No orders have been placed yet."
        >
          {recentOrders.map((order) => (
            <Link
              className="admin-list-row"
              href={`/admin/orders/${order.id}` as Route}
              key={order.id}
            >
              <span>
                <strong>{order.number}</strong>
                <small>{order.user?.name ?? order.email}</small>
              </span>
              <span>
                <small>{order.status.replaceAll("_", " ")}</small>
                <strong>{formatMoney(order.totalCents, "en")}</strong>
              </span>
            </Link>
          ))}
        </AdminTable>
        <AdminTable
          title="Bestselling products"
          href="/admin/products"
          empty="Sales data will appear after paid orders."
        >
          {bestsellers.map((item) => (
            <div className="admin-list-row" key={item.productId}>
              <span>
                <strong>{item.productName}</strong>
                <small>{item._sum.quantity ?? 0} units sold</small>
              </span>
              <strong>
                {formatMoney(item._sum.lineTotalCents ?? 0, "en")}
              </strong>
            </div>
          ))}
        </AdminTable>
        <AdminTable
          title="Low-stock products"
          href="/admin/inventory"
          empty="No variants are at or below their threshold."
        >
          {lowStock.slice(0, 5).map((item) => (
            <div className="admin-list-row" key={item.id}>
              <span>
                <strong>
                  {item.variant.product.translations[0]?.name ??
                    item.variant.sku}
                </strong>
                <small>{item.variant.sku}</small>
              </span>
              <strong className="text-danger">
                {item.onHand - item.reserved} available
              </strong>
            </div>
          ))}
        </AdminTable>
        <AdminTable
          title="Wholesale applications"
          href="/admin/wholesale"
          empty="No wholesale applications yet."
        >
          {recentApplications.map((item) => (
            <div className="admin-list-row" key={item.id}>
              <span>
                <strong>{item.companyName}</strong>
                <small>{item.contactName}</small>
              </span>
              <span className="admin-status">
                {item.status.replaceAll("_", " ")}
              </span>
            </div>
          ))}
        </AdminTable>
        <AdminTable
          title="Inventory activity"
          href="/admin/inventory"
          empty="No inventory adjustments yet."
        >
          {adjustments.map((item) => (
            <div className="admin-list-row" key={item.id}>
              <span>
                <strong>
                  {item.inventory.variant.product.translations[0]?.name ??
                    item.inventory.variant.sku}
                </strong>
                <small>{item.reason}</small>
              </span>
              <strong>
                {item.quantity > 0 ? "+" : ""}
                {item.quantity}
              </strong>
            </div>
          ))}
        </AdminTable>
        {canAccessAdmin(role, "audit-logs") && (
          <AdminTable
            title="Recent audit activity"
            href="/admin/audit-logs"
            empty="No sensitive admin actions recorded yet."
          >
            {audits.map((item) => (
              <div className="admin-list-row" key={item.id}>
                <span>
                  <strong>{item.action.replaceAll("_", " ")}</strong>
                  <small>
                    {item.actor?.name ?? "System"} · {item.entityType}
                  </small>
                </span>
                <time>{item.createdAt.toLocaleDateString("en-DE")}</time>
              </div>
            ))}
          </AdminTable>
        )}
      </div>
    </div>
  );
}

function AdminTable({
  title,
  href,
  empty,
  children,
}: {
  title: string;
  href: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <section className="admin-card">
      <header>
        <h2>{title}</h2>
        <Link href={href as Route}>
          View all <ArrowUpRight size={14} />
        </Link>
      </header>
      <div>
        {hasChildren ? children : <p className="admin-empty">{empty}</p>}
      </div>
    </section>
  );
}
