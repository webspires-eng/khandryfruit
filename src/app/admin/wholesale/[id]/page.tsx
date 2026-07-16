import { notFound } from "next/navigation";

import { AdminForm } from "@/components/admin/admin-form";
import { AdminSection, Checkbox, Field, SelectField, TextField } from "@/components/admin/product-form";
import { db } from "@/lib/db/client";
import { decideWholesaleAction } from "@/server/actions/admin";
import { requireAdmin } from "@/server/policies/authorization";

export default async function WholesaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("wholesale");
  const { id } = await params;
  const application = await db.wholesaleApplication.findUnique({ where: { id }, include: { user: { include: { wholesaleAccount: true } } } });
  if (!application) notFound();
  return <div className="admin-page-v2"><div className="admin-page-heading"><div><p className="eyebrow">Wholesale application</p><h1>{application.companyName}</h1><p>{application.contactName} · {application.email} · {application.countryCode}</p></div></div><div className="admin-two-column"><section className="admin-card"><header><h2>Application</h2><span className="admin-status">{application.status}</span></header><dl className="admin-summary"><dt>Business type</dt><dd>{application.businessType}</dd><dt>Monthly volume</dt><dd>{application.monthlyOrderVolume}</dd><dt>Products</dt><dd>{application.productsOfInterest.join(", ") || "—"}</dd><dt>Delivery countries</dt><dd>{application.deliveryCountries.join(", ") || "—"}</dd><dt>VAT ID</dt><dd>{application.vatId ?? "—"}</dd><dt>Message</dt><dd>{application.message ?? "—"}</dd></dl></section><AdminForm action={decideWholesaleAction} submitLabel="Save decision"><input type="hidden" name="applicationId" value={application.id} /><AdminSection title="Decision" description="The previous and new status are audited with the acting administrator."><SelectField label="Status" name="status" defaultValue={application.status} options={["UNDER_REVIEW", "MORE_INFORMATION_REQUIRED", "APPROVED", "REJECTED"].map((value) => ({ value, label: value.replaceAll("_", " ") }))} /><Field label="Minimum order in cents" name="minimumOrderCents" type="number" min={0} defaultValue={application.user?.wholesaleAccount?.minimumOrderCents} /><Checkbox label="Invoice payment eligible" name="invoicePaymentEligible" defaultChecked={application.user?.wholesaleAccount?.invoicePaymentEligible} /><TextField label="Internal notes" name="internalNotes" defaultValue={application.internalNotes} /></AdminSection></AdminForm></div></div>;
}
