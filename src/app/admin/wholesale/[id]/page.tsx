import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminForm } from "@/components/admin/admin-form";
import {
  AdminSection,
  Checkbox,
  Field,
  SelectField,
  TextField,
} from "@/components/admin/product-form";
import {
  wholesaleTransitions,
  type WholesaleState,
} from "@/lib/commerce/admin-rules";
import { formatMoney } from "@/lib/commerce/money";
import { db } from "@/lib/db/client";
import { decideWholesaleAction } from "@/server/actions/admin";
import { requireAdmin } from "@/server/policies/authorization";
import {
  humanise,
  statusLabel,
  statusTone,
  wholesaleDateFormat,
} from "../status";

export default async function WholesaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("wholesale");
  const { id } = await params;
  const app = await db.wholesaleApplication.findUnique({
    where: { id },
    include: { user: { include: { wholesaleAccount: true } } },
  });
  if (!app) notFound();

  // Only offer transitions the server will accept, so an operator can never
  // pick an option that fails on submit. APPROVED/REJECTED are terminal.
  const allowed = wholesaleTransitions[app.status as WholesaleState] ?? [];
  const account = app.user?.wholesaleAccount;

  return (
    <div className="admin-page-v2">
      <div className="admin-page-heading">
        <div>
          <Link className="admin-back-link" href="/admin/wholesale">
            <ArrowLeft size={13} /> All applications
          </Link>
          <p className="eyebrow">Wholesale application</p>
          <h1>{app.companyName}</h1>
          <p>
            {app.contactName} · {humanise(app.businessType)} ·{" "}
            {humanise(app.monthlyOrderVolume)} per month
          </p>
        </div>
        <span className={`admin-status ${statusTone[app.status] ?? ""}`}>
          {statusLabel[app.status] ?? app.status}
        </span>
      </div>

      <div className="admin-two-column">
        <div className="admin-tab-panel">
          <section className="admin-card">
            <header>
              <h2>Applicant</h2>
            </header>
            <dl className="admin-summary">
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${app.email}`}>{app.email}</a>
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>
                  <a href={`tel:${app.phone}`}>{app.phone}</a>
                </dd>
              </div>
              <div>
                <dt>Preferred contact</dt>
                <dd>
                  {app.preferredContactMethod
                    ? humanise(app.preferredContactMethod)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>
                  {app.businessAddress}
                  {app.city ? `, ${app.city}` : ""}
                  {app.postalCode ? ` ${app.postalCode}` : ""} ·{" "}
                  {app.countryCode}
                </dd>
              </div>
              <div>
                <dt>Website</dt>
                <dd>
                  {app.website ? (
                    <a
                      href={app.website}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {app.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="admin-card">
            <header>
              <h2>Business details</h2>
            </header>
            <dl className="admin-summary">
              <div>
                <dt>VAT ID</dt>
                <dd>{app.vatId ?? "—"}</dd>
              </div>
              <div>
                <dt>Registration number</dt>
                <dd>{app.registrationNumber ?? "—"}</dd>
              </div>
              <div>
                <dt>Products of interest</dt>
                <dd>{app.productsOfInterest.join(", ") || "—"}</dd>
              </div>
              <div>
                <dt>Delivery countries</dt>
                <dd>{app.deliveryCountries.join(", ") || "—"}</dd>
              </div>
              <div>
                <dt>Applied</dt>
                <dd>{wholesaleDateFormat.format(app.createdAt)}</dd>
              </div>
              <div>
                <dt>Reviewed</dt>
                <dd>
                  {app.reviewedAt
                    ? wholesaleDateFormat.format(app.reviewedAt)
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>

          {app.message && (
            <section className="admin-card">
              <header>
                <h2>Message</h2>
              </header>
              <blockquote className="admin-quote">{app.message}</blockquote>
            </section>
          )}
        </div>

        <div className="admin-tab-panel">
          {account && (
            <section className="admin-card">
              <header>
                <h2>Trade account</h2>
                <span className="admin-status is-positive">Active</span>
              </header>
              <dl className="admin-summary">
                <div>
                  <dt>Minimum order</dt>
                  <dd>{formatMoney(account.minimumOrderCents ?? 0, "en")}</dd>
                </div>
                <div>
                  <dt>Invoice payment</dt>
                  <dd>
                    {account.invoicePaymentEligible ? "Eligible" : "Disabled"}
                  </dd>
                </div>
                <div>
                  <dt>Approved</dt>
                  <dd>{wholesaleDateFormat.format(account.approvedAt)}</dd>
                </div>
              </dl>
            </section>
          )}

          {allowed.length > 0 ? (
            <AdminForm
              action={decideWholesaleAction}
              submitLabel="Save decision"
            >
              <input type="hidden" name="applicationId" value={app.id} />
              <AdminSection
                title="Record a decision"
                description="Approving assigns the wholesale customer role and creates the trade account. Every decision is written to the audit log."
              >
                <div className="admin-field-grid">
                  <SelectField
                    label="Decision"
                    name="status"
                    required
                    options={allowed.map((value) => ({
                      value,
                      label: statusLabel[value] ?? value,
                    }))}
                  />
                  <Field
                    label="Minimum order"
                    name="minimumOrderCents"
                    type="number"
                    min={0}
                    defaultValue={account?.minimumOrderCents}
                    hint="In cents. Applies on approval."
                  />
                  <Checkbox
                    label="Invoice payment eligible"
                    name="invoicePaymentEligible"
                    defaultChecked={account?.invoicePaymentEligible}
                  />
                  <TextField
                    label="Internal notes"
                    name="internalNotes"
                    defaultValue={app.internalNotes}
                    rows={5}
                  />
                </div>
              </AdminSection>
            </AdminForm>
          ) : (
            <section className="admin-card">
              <header>
                <h2>Decision</h2>
                <span
                  className={`admin-status ${statusTone[app.status] ?? ""}`}
                >
                  {statusLabel[app.status] ?? app.status}
                </span>
              </header>
              <p className="admin-empty">
                This application is closed and cannot change status again.
              </p>
              {app.internalNotes && (
                <blockquote className="admin-quote">
                  {app.internalNotes}
                </blockquote>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
