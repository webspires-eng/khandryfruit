import { AdminForm } from "@/components/admin/admin-form";
import { AdminSection, Field } from "@/components/admin/product-form";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { updateSettingAction } from "@/server/actions/admin";
import { requireAdmin } from "@/server/policies/authorization";

const groups = {
  Business: [
    "business.tradingName",
    "business.registeredName",
    "business.owner",
    "business.address",
    "business.phone",
    "business.whatsapp",
    "business.email",
    "business.registrationNumber",
    "business.vatId",
    "business.taxNumber",
    "business.lucidNumber",
    "business.foodBusinessRegistration",
  ],
  Commerce: [
    "commerce.currency",
    "commerce.vatMode",
    "commerce.minimumOrderCents",
    "commerce.freeShippingThresholdCents",
    "commerce.stockReservationMinutes",
  ],
  Shipping: ["shipping.dispatchEstimate", "shipping.deliveryEstimate"],
  Brand: ["brand.socialHandle"],
  Compliance: ["compliance.cookieConsentVersion"],
} as const;
const display = (value: unknown) =>
  typeof value === "string"
    ? value
    : value == null
      ? ""
      : JSON.stringify(value);
export default async function SettingsPage() {
  await requireAdmin("settings");
  const settings = await db.siteSetting.findMany();
  const values = new Map(settings.map((s) => [s.key, display(s.value)]));
  const integrations = [
    { name: "Database", ok: Boolean(env.DATABASE_URL) },
    {
      name: "Stripe",
      ok: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
    },
    { name: "Email", ok: Boolean(env.AWS_SES_FROM_EMAIL) },
    {
      name: "Cloudflare R2",
      ok: Boolean(
        env.CLOUDFLARE_R2_BUCKET && env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      ),
    },
    { name: "Analytics", ok: Boolean(env.GOOGLE_ANALYTICS_ID) },
  ];
  return (
    <div className="admin-page-v2">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Super administrator</p>
          <h1>Site settings</h1>
          <p>
            Secret values are never rendered. Integration cards report
            configuration status only.
          </p>
        </div>
      </div>
      <section className="admin-card">
        <header>
          <h2>Integration status</h2>
        </header>
        {integrations.map((i) => (
          <div className="admin-list-row" key={i.name}>
            <strong>{i.name}</strong>
            <span className="admin-status">
              {i.ok ? "Configured" : "Not configured"}
            </span>
          </div>
        ))}
      </section>
      {Object.entries(groups).map(([group, keys]) => (
        <section className="admin-card" key={group}>
          <header>
            <h2>{group}</h2>
          </header>
          {keys.map((key) => (
            <AdminForm
              key={key}
              action={updateSettingAction}
              submitLabel="Save"
            >
              <input type="hidden" name="key" value={key} />
              <AdminSection
                title={key.split(".")[1].replace(/([A-Z])/g, " $1")}
              >
                <Field
                  label="Value"
                  name="value"
                  defaultValue={values.get(key) ?? ""}
                  wide
                />
              </AdminSection>
            </AdminForm>
          ))}
        </section>
      ))}
    </div>
  );
}
