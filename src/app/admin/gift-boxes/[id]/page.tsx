import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminForm, ConfirmForm } from "@/components/admin/admin-form";
import {
  AdminSection,
  Checkbox,
  Field,
  SelectField,
  TextField,
} from "@/components/admin/product-form";
import { db } from "@/lib/db/client";
import {
  addGiftBoxItemAction,
  deleteGiftBoxAction,
  removeGiftBoxItemAction,
  updateGiftBoxAction,
} from "@/server/actions/admin";
import { requireAdmin } from "@/server/policies/authorization";

export default async function GiftBoxDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin("gift-boxes");
  const { id } = await params;
  const box = await db.giftBox.findUnique({
    where: { id },
    include: {
      items: { include: { product: true, variant: true } },
      _count: { select: { configurations: true } },
    },
  });
  if (!box) notFound();
  const variants = await db.productVariant.findMany({
    include: { product: true },
    orderBy: { sku: "asc" },
  });
  const blockers = box.items.filter(
    (item) => item.product.status !== "ACTIVE" || !item.variant.active,
  );
  return (
    <div className="admin-page-v2">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">
            {box.fixed ? "Fixed gift box" : "Builder template"}
          </p>
          <h1>{box.nameEn}</h1>
          <p>
            {box.nameDe} · {box.active ? "Active" : "Draft"}
          </p>
        </div>
        <div className="admin-row-actions">
          <Link className="table-action" href="/admin/gift-boxes">
            Back
          </Link>
          <ConfirmForm
            action={deleteGiftBoxAction}
            confirmMessage={
              box._count.configurations
                ? "This gift box has customer configurations and cannot be deleted. Deactivate it via Edit instead."
                : "Delete this gift box permanently?"
            }
          >
            <input type="hidden" name="giftBoxId" value={box.id} />
            <button
              className="table-action"
              disabled={box._count.configurations > 0}
            >
              Delete
            </button>
          </ConfirmForm>
        </div>
      </div>

      <div className="admin-two-column">
        <AdminForm action={updateGiftBoxAction} submitLabel="Save gift box">
          <input type="hidden" name="giftBoxId" value={box.id} />
          <AdminSection
            title="Bilingual gift box"
            description="Capacity and selection limits are validated on the server."
          >
            <div className="admin-field-grid">
              <Field
                label="German name"
                name="nameDe"
                required
                defaultValue={box.nameDe}
              />
              <Field
                label="English name"
                name="nameEn"
                required
                defaultValue={box.nameEn}
              />
              <Field
                label="German slug"
                name="slugDe"
                required
                defaultValue={box.slugDe}
              />
              <Field
                label="English slug"
                name="slugEn"
                required
                defaultValue={box.slugEn}
              />
              <SelectField
                label="Size"
                name="sizeName"
                required
                defaultValue={box.sizeName}
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
                defaultValue={String(box.basePriceCents)}
              />
              <Field
                label="Capacity units"
                name="capacityUnits"
                type="number"
                min={1}
                required
                defaultValue={String(box.capacityUnits)}
              />
              <Field
                label="Minimum selections"
                name="minItems"
                type="number"
                min={1}
                required
                defaultValue={String(box.minItems)}
              />
              <Field
                label="Maximum selections"
                name="maxItems"
                type="number"
                min={1}
                required
                defaultValue={String(box.maxItems)}
              />
              <TextField
                label="German description"
                name="descriptionDe"
                defaultValue={box.descriptionDe}
              />
              <TextField
                label="English description"
                name="descriptionEn"
                defaultValue={box.descriptionEn}
              />
              <Field
                label="German SEO title"
                name="seoTitleDe"
                defaultValue={box.seoTitleDe}
              />
              <Field
                label="English SEO title"
                name="seoTitleEn"
                defaultValue={box.seoTitleEn}
              />
              <TextField
                label="German meta description"
                name="metaDescriptionDe"
                defaultValue={box.metaDescriptionDe}
              />
              <TextField
                label="English meta description"
                name="metaDescriptionEn"
                defaultValue={box.metaDescriptionEn}
              />
              <Checkbox
                name="fixed"
                label="Fixed contents"
                defaultChecked={box.fixed}
              />
              <Checkbox
                name="active"
                label="Active storefront template"
                defaultChecked={box.active}
              />
            </div>
          </AdminSection>
        </AdminForm>

        <section className="admin-card">
          <header>
            <h2>Constituent variants</h2>
          </header>
          {box.items.map((item) => (
            <div className="admin-list-row" key={item.variantId}>
              <span>
                <strong>{item.product.internalName}</strong>
                <small>
                  {item.variant.sku} · quantity {item.quantity} ·{" "}
                  {item.product.status}/
                  {item.variant.active ? "ACTIVE" : "INACTIVE"}
                </small>
              </span>
              <ConfirmForm
                action={removeGiftBoxItemAction}
                confirmMessage="Remove this variant from the gift box?"
              >
                <input type="hidden" name="giftBoxId" value={box.id} />
                <input type="hidden" name="variantId" value={item.variantId} />
                <button className="table-action">Remove</button>
              </ConfirmForm>
            </div>
          ))}
          {!box.items.length && (
            <p className="admin-empty">No constituent variants assigned.</p>
          )}
          {blockers.length > 0 && (
            <p className="admin-form-error">
              This gift box must not be activated until all referenced products
              and variants are active.
            </p>
          )}

          <AdminForm action={addGiftBoxItemAction} submitLabel="Add variant">
            <input type="hidden" name="giftBoxId" value={box.id} />
            <div className="admin-field-grid">
              <SelectField
                label="Variant"
                name="variantId"
                required
                options={variants.map((variant) => ({
                  value: variant.id,
                  label: `${variant.product.internalName} — ${variant.sku}`,
                }))}
              />
              <Field
                label="Quantity"
                name="quantity"
                type="number"
                min={1}
                required
                defaultValue="1"
              />
              <Field
                label="Capacity units"
                name="units"
                type="number"
                min={1}
                required
                defaultValue="1"
              />
            </div>
          </AdminForm>
        </section>
      </div>
    </div>
  );
}
