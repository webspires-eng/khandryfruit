import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { formatMoney } from "@/lib/commerce/money";
import { requireAdmin } from "@/server/policies/authorization";

export default async function GiftBoxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("gift-boxes");
  const { id } = await params;
  const box = await db.giftBox.findUnique({ where: { id }, include: { items: { include: { product: true, variant: true } } } });
  if (!box) notFound();
  const blockers = box.items.filter((item) => item.product.status !== "ACTIVE" || !item.variant.active);
  return <div className="admin-page-v2"><div className="admin-page-heading"><div><p className="eyebrow">{box.fixed ? "Fixed gift box" : "Builder template"}</p><h1>{box.nameEn}</h1><p>{box.nameDe} · {box.active ? "Active" : "Draft"}</p></div></div><div className="admin-two-column"><section className="admin-card"><header><h2>Configuration</h2></header><dl className="admin-summary"><dt>Base charge</dt><dd>{formatMoney(box.basePriceCents, "en")}</dd><dt>Capacity</dt><dd>{box.capacityUnits} units</dd><dt>Selections</dt><dd>{box.minItems}–{box.maxItems}</dd><dt>German slug</dt><dd>{box.slugDe}</dd><dt>English slug</dt><dd>{box.slugEn}</dd></dl></section><section className="admin-card"><header><h2>Constituent variants</h2></header>{box.items.map((item) => <div className="admin-list-row" key={item.variantId}><span><strong>{item.product.internalName}</strong><small>{item.variant.sku} · quantity {item.quantity}</small></span><span className="admin-status">{item.product.status}/{item.variant.active ? "ACTIVE" : "INACTIVE"}</span></div>)}{!box.items.length && <p className="admin-empty">No constituent variants assigned.</p>}{blockers.length > 0 && <p className="admin-form-error">This gift box must not be activated until all referenced products and variants are active.</p>}</section></div></div>;
}
