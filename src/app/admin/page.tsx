import Link from "next/link";
import type { Route } from "next";
import {
  AlertTriangle,
  Activity,
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
  const metrics = [
    [
      "Revenue",
      formatMoney(paidTotals._sum.totalCents ?? 0, "en"),
      CircleDollarSign,
    ],
    ["Paid orders", paidOrders, PackageCheck],
    ["Pending orders", pendingOrders, ClipboardList],
    [
      "Average order",
      formatMoney(Math.round(paidTotals._avg.totalCents ?? 0), "en"),
      CircleDollarSign,
    ],
    ["Customers", customers, Users],
    ["Wholesale applications", applications, Store],
    ["Low-stock variants", lowStock.length, AlertTriangle],
    ["Draft products", drafts, Boxes],
    ["Publication blocked", blocked, AlertTriangle],
    ["Pending reviews", pendingReviews, Star],
  ] as const;
  const priorityCount = pendingOrders + applications + lowStock.length + blocked;
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
      </div>
      <section className="admin-command-panel">
        <div className="admin-command-copy">
          <p className="eyebrow">Operations centre</p>
          <h2>Keep the store moving</h2>
          <p>
            Review orders, stock, publishing readiness and customer requests
            from one workspace.
          </p>
          <div className="admin-command-state">
            <Activity size={18} />
            <span>
              <strong>{priorityCount} items need attention</strong>
              <small>Calculated from live operational records</small>
            </span>
          </div>
        </div>
        <div className="admin-quick-actions">
          <p>Quick actions</p>
          {canAccessAdmin(role, "products") && (
            <Link href="/admin/products/new">
              <Plus size={18} />
              <span>
                <strong>New product</strong>
                <small>Create a catalogue draft</small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
          )}
          {canAccessAdmin(role, "orders") && (
            <Link href="/admin/orders">
              <ClipboardList size={18} />
              <span>
                <strong>Process orders</strong>
                <small>{pendingOrders} pending payment checks</small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
          )}
          {canAccessAdmin(role, "inventory") && (
            <Link href="/admin/inventory">
              <Warehouse size={18} />
              <span>
                <strong>Update inventory</strong>
                <small>{lowStock.length} low-stock variants</small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
          )}
        </div>
      </section>
      <div className="admin-section-title">
        <div>
          <p className="eyebrow">Live overview</p>
          <h2>Store performance</h2>
        </div>
        <small>Database-backed totals only</small>
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
