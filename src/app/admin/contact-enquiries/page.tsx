import Link from "next/link";

import { db } from "@/lib/db/client";
import { requireAdmin } from "@/server/policies/authorization";

const statuses = ["NEW", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "SPAM"];

export default async function ContactEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin("contact-enquiries");
  const { status = "" } = await searchParams;
  const enquiries = await db.contactEnquiry.findMany({
    where: statuses.includes(status) ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="admin-page-v2">
      <div className="admin-page-heading"><div><p className="eyebrow">Customer support</p><h1>Contact enquiries</h1><p>Customer messages and their internal handling status.</p></div></div>
      <form className="admin-filterbar">
        <select name="status" defaultValue={status}><option value="">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select>
        <button className="button">Apply</button>
      </form>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Type</th><th>Order</th><th>Status</th><th>Date</th><th /></tr></thead><tbody>
        {enquiries.map((enquiry) => <tr key={enquiry.id}><td><strong>{enquiry.name}</strong><small>{enquiry.email}</small></td><td>{enquiry.type}</td><td>{enquiry.orderNumber ?? "—"}</td><td><span className="admin-status">{enquiry.status}</span></td><td>{enquiry.createdAt.toLocaleDateString("en-GB")}</td><td><Link href={`/admin/contact-enquiries/${enquiry.id}`}>Review</Link></td></tr>)}
      </tbody></table>{!enquiries.length && <p className="admin-empty">No contact enquiries match this filter.</p>}</div>
    </div>
  );
}
