import { notFound } from "next/navigation";

import { AdminForm } from "@/components/admin/admin-form";
import { AdminSection, SelectField } from "@/components/admin/product-form";
import { db } from "@/lib/db/client";
import { updateContactEnquiryAction } from "@/server/actions/admin";
import { requireAdmin } from "@/server/policies/authorization";

const statuses = [
  "NEW",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "SPAM",
];

export default async function ContactEnquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("contact-enquiries");
  const { id } = await params;
  const enquiry = await db.contactEnquiry.findUnique({ where: { id } });
  if (!enquiry) notFound();
  const relatedOrder = enquiry.orderNumber
    ? await db.order.findUnique({
        where: { number: enquiry.orderNumber },
        select: { id: true, number: true },
      })
    : null;
  return (
    <div className="admin-page-v2">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Contact enquiry</p>
          <h1>{enquiry.subject || enquiry.type}</h1>
          <p>
            {enquiry.name} · {enquiry.email} · {enquiry.locale}
          </p>
        </div>
      </div>
      <div className="admin-two-column">
        <section className="admin-card">
          <header>
            <h2>Message</h2>
            <span className="admin-status">{enquiry.status}</span>
          </header>
          <p>{enquiry.message}</p>
          <dl className="admin-summary">
            <dt>Phone</dt>
            <dd>{enquiry.phone ?? "—"}</dd>
            <dt>Preferred contact</dt>
            <dd>{enquiry.preferredContactMethod ?? "—"}</dd>
            <dt>Order</dt>
            <dd>
              {relatedOrder ? (
                <a href={`/admin/orders/${relatedOrder.number}`}>
                  {relatedOrder.number}
                </a>
              ) : (
                (enquiry.orderNumber ?? "—")
              )}
            </dd>
            <dt>Received</dt>
            <dd>{enquiry.createdAt.toLocaleString("en-GB")}</dd>
          </dl>
        </section>
        <AdminForm
          action={updateContactEnquiryAction}
          submitLabel="Update status"
        >
          <input type="hidden" name="enquiryId" value={enquiry.id} />
          <AdminSection
            title="Workflow status"
            description="Status changes are recorded in the audit log."
          >
            <SelectField
              label="Status"
              name="status"
              defaultValue={enquiry.status}
              options={statuses.map((value) => ({
                value,
                label: value.replaceAll("_", " "),
              }))}
            />
          </AdminSection>
        </AdminForm>
      </div>
    </div>
  );
}
