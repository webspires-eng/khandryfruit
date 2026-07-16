import { AdminForm } from "@/components/admin/admin-form";
import { AdminSection, Checkbox, Field, TextField } from "@/components/admin/product-form";
import { formatMoney } from "@/lib/commerce/money";
import { db } from "@/lib/db/client";
import { upsertPackagingAction } from "@/server/actions/admin";
import { requireAdmin } from "@/server/policies/authorization";

export default async function PackagingPage() {
  await requireAdmin("packaging");
  const options = await db.giftPackagingOption.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return <div className="admin-page-v2"><div className="admin-page-heading"><div><p className="eyebrow">Gift boxes</p><h1>Packaging</h1><p>Bilingual packaging choices and their customer-visible charges.</p></div></div>
    {options.map((option) => <AdminForm key={option.id} action={upsertPackagingAction} submitLabel="Save packaging"><input type="hidden" name="packagingId" value={option.id} /><AdminSection title={`${option.nameEn} · ${formatMoney(option.priceCents, "en")}`}><div className="admin-field-grid"><Field label="German name" name="nameDe" defaultValue={option.nameDe} required /><Field label="English name" name="nameEn" defaultValue={option.nameEn} required /><TextField label="German description" name="descriptionDe" defaultValue={option.descriptionDe} /><TextField label="English description" name="descriptionEn" defaultValue={option.descriptionEn} /><Field label="Price in cents" name="priceCents" type="number" min={0} defaultValue={option.priceCents} required /><Field label="Sort order" name="sortOrder" type="number" min={0} defaultValue={option.sortOrder} required /><Checkbox label="Active" name="active" defaultChecked={option.active} /></div></AdminSection></AdminForm>)}
    <AdminForm action={upsertPackagingAction} submitLabel="Create packaging"><AdminSection title="New packaging option"><div className="admin-field-grid"><Field label="German name" name="nameDe" required /><Field label="English name" name="nameEn" required /><TextField label="German description" name="descriptionDe" /><TextField label="English description" name="descriptionEn" /><Field label="Price in cents" name="priceCents" type="number" min={0} defaultValue={0} required /><Field label="Sort order" name="sortOrder" type="number" min={0} defaultValue={0} required /><Checkbox label="Active" name="active" defaultChecked /></div></AdminSection></AdminForm>
  </div>;
}
