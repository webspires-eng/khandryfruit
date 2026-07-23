import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminForm, ConfirmForm } from "@/components/admin/admin-form";
import {
  AdminSection,
  SelectField,
  TextField,
} from "@/components/admin/product-form";
import { formatAddressLines } from "@/lib/commerce/address";
import { formatMoney } from "@/lib/commerce/money";
import { db } from "@/lib/db/client";
import {
  requestCustomerAnonymisationAction,
  updateCustomerNotesAction,
  updateUserRoleAction,
} from "@/server/actions/admin";
import { requireAdmin } from "@/server/policies/authorization";

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin("customers");
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      profile: true,
      addresses: true,
      orders: { orderBy: { createdAt: "desc" } },
      wholesaleApplications: { orderBy: { createdAt: "desc" } },
      wholesaleAccount: true,
    },
  });
  if (!user) notFound();
  return (
    <div className="admin-page-v2">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Customer profile</p>
          <h1>{user.name}</h1>
          <p>
            {user.email} · {user.role.replaceAll("_", " ")} · Joined{" "}
            {user.createdAt.toLocaleDateString("en-DE")}
          </p>
        </div>
        <Link
          className="button secondary"
          href={`/admin/customers/${user.id}/export`}
        >
          Export customer data
        </Link>
      </div>
      <div className="admin-two-column">
        <section className="admin-card">
          <header>
            <h2>Profile and consent</h2>
          </header>
          <p>Phone: {user.profile?.phone ?? "Not provided"}</p>
          <p>
            Marketing consent:{" "}
            {user.marketingConsentAt?.toLocaleString("en-DE") ?? "Not granted"}
          </p>
          <p>
            Wholesale:{" "}
            {user.wholesaleAccount
              ? `Approved · minimum ${formatMoney(user.wholesaleAccount.minimumOrderCents ?? 0, "en")}`
              : "Not approved"}
          </p>
          {user.addresses.map((a) => (
            <address key={a.id}>
              {formatAddressLines(a).map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
              {a.phone && <span>{a.phone}</span>}
            </address>
          ))}
        </section>
        <section className="admin-card">
          <header>
            <h2>Orders</h2>
          </header>
          {user.orders.map((o) => (
            <div className="admin-list-row" key={o.id}>
              <span>
                <strong>{o.number}</strong>
                <small>{o.status}</small>
              </span>
              <b>{formatMoney(o.totalCents, "en")}</b>
            </div>
          ))}
          {!user.orders.length && <p className="admin-empty">No orders yet.</p>}
        </section>
      </div>
      <AdminForm
        action={updateCustomerNotesAction}
        submitLabel="Save internal notes"
      >
        <input type="hidden" name="userId" value={user.id} />
        <AdminSection
          title="Internal notes"
          description="Never visible to the customer."
        >
          <TextField
            label="Notes"
            name="internalNotes"
            defaultValue={user.profile?.internalNotes}
            rows={6}
          />
        </AdminSection>
      </AdminForm>
      {String(session.user.role) === "SUPER_ADMIN" && (
        <AdminForm
          action={updateUserRoleAction}
          submitLabel="Update account role"
        >
          <input type="hidden" name="userId" value={user.id} />
          <AdminSection
            title="Role assignment"
            description="Critical role changes are restricted to super administrators and audited."
          >
            <SelectField
              label="Role"
              name="role"
              defaultValue={user.role}
              required
              options={[
                "CUSTOMER",
                "WHOLESALE_CUSTOMER",
                "CONTENT_EDITOR",
                "ORDER_MANAGER",
                "ADMIN",
                "SUPER_ADMIN",
              ].map((role) => ({
                value: role,
                label: role.replaceAll("_", " "),
              }))}
            />
          </AdminSection>
        </AdminForm>
      )}
      <ConfirmForm
        action={requestCustomerAnonymisationAction}
        confirmMessage="Disable this account and record a deletion request?"
      >
        <input type="hidden" name="userId" value={user.id} />
        <button className="button secondary" disabled={user.disabled}>
          Request account anonymisation
        </button>
      </ConfirmForm>
    </div>
  );
}
