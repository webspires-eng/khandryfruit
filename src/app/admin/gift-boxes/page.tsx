import { AdminForm } from "@/components/admin/admin-form";
import {
  AdminSection,
  Checkbox,
  Field,
  SelectField,
  TextField,
} from "@/components/admin/product-form";
import { formatMoney } from "@/lib/commerce/money";
import { db } from "@/lib/db/client";
import { createGiftBoxAction } from "@/server/actions/admin";
import { requireAdmin } from "@/server/policies/authorization";
import Link from "next/link";

export default async function GiftBoxesPage() {
  await requireAdmin("gift-boxes");
  const boxes = await db.giftBox.findMany({
    include: { _count: { select: { items: true, configurations: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="admin-page-v2">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Gifting catalogue</p>
          <h1>Gift boxes</h1>
          <p>
            Fixed boxes and configurable templates with bilingual content and
            capacity controls.
          </p>
        </div>
        <Link className="button" href="/admin/gift-boxes/new">New gift box</Link>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Size</th>
              <th>Capacity</th>
              <th>Selection</th>
              <th>Base price</th>
              <th>Status</th>
              <th>Configurations</th>
            </tr>
          </thead>
          <tbody>
            {boxes.map((b) => (
              <tr key={b.id}>
                <td>
                  <strong>{b.nameEn}</strong>
                  <small>{b.nameDe}</small>
                  <Link href={`/admin/gift-boxes/${b.id}`}>Edit</Link>
                </td>
                <td>{b.fixed ? "Fixed" : "Custom"}</td>
                <td>{b.sizeName}</td>
                <td>{b.capacityUnits}</td>
                <td>
                  {b.minItems}-{b.maxItems}
                </td>
                <td>{formatMoney(b.basePriceCents, "en")}</td>
                <td>{b.active ? "Active" : "Draft"}</td>
                <td>{b._count.configurations}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!boxes.length && (
          <p className="admin-empty">No gift-box templates yet.</p>
        )}
      </div>
      <AdminForm
        action={createGiftBoxAction}
        submitLabel="Create gift-box template"
      >
        <AdminSection
          title="Bilingual gift box"
          description="Capacity and selection limits are validated on the server."
        >
          <div className="admin-field-grid">
            <Field label="German name" name="nameDe" required />
            <Field label="English name" name="nameEn" required />
            <Field label="German slug" name="slugDe" required />
            <Field label="English slug" name="slugEn" required />
            <SelectField
              label="Size"
              name="sizeName"
              required
              options={["SMALL", "MEDIUM", "LARGE"].map((v) => ({
                value: v,
                label: v,
              }))}
            />
            <Field
              label="Base price in cents"
              name="basePriceCents"
              type="number"
              min={0}
              required
            />
            <Field
              label="Capacity units"
              name="capacityUnits"
              type="number"
              min={1}
              required
            />
            <Field
              label="Minimum selections"
              name="minItems"
              type="number"
              min={1}
              required
            />
            <Field
              label="Maximum selections"
              name="maxItems"
              type="number"
              min={1}
              required
            />
            <TextField label="German description" name="descriptionDe" />
            <TextField label="English description" name="descriptionEn" />
            <Field label="German SEO title" name="seoTitleDe" />
            <Field label="English SEO title" name="seoTitleEn" />
            <TextField
              label="German meta description"
              name="metaDescriptionDe"
            />
            <TextField
              label="English meta description"
              name="metaDescriptionEn"
            />
            <Checkbox name="fixed" label="Fixed contents" />
            <Checkbox name="active" label="Active storefront template" />
          </div>
        </AdminSection>
      </AdminForm>
    </div>
  );
}
