import { AdminForm, ConfirmForm } from "@/components/admin/admin-form";
import {
  AdminSection,
  Field,
  SelectField,
  TextField,
} from "@/components/admin/product-form";
import { db } from "@/lib/db/client";
import {
  archiveCategoryAction,
  createCategoryAction,
  updateCategoryAction,
} from "@/server/actions/admin";
import { requireAdmin } from "@/server/policies/authorization";
export default async function CategoriesPage() {
  await requireAdmin("categories");
  const categories = await db.category.findMany({
    include: { translations: true, _count: { select: { products: true } } },
    orderBy: [{ sortOrder: "asc" }, { internalName: "asc" }],
  });
  return (
    <div className="admin-page-v2">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Catalogue structure</p>
          <h1>Categories</h1>
          <p>
            Manage bilingual navigation and product grouping. Categories with
            products cannot be archived.
          </p>
        </div>
      </div>
      <div className="admin-two-column">
        <section className="admin-card">
          <header>
            <h2>Current categories</h2>
          </header>
          {categories.length ? (
            categories.map((category) => {
              const de = category.translations.find(
                (item) => item.locale === "de",
              );
              const en = category.translations.find(
                (item) => item.locale === "en",
              );
              return (
                <div key={category.id}>
                  <div className="admin-list-row">
                    <span>
                      <strong>{en?.name ?? category.internalName}</strong>
                      <small>
                        {de?.name} · {category._count.products} products ·{" "}
                        {category.active ? "Active" : "Archived"}
                      </small>
                    </span>
                    {category.active && (
                      <ConfirmForm
                        action={archiveCategoryAction}
                        confirmMessage="Archive this empty category?"
                      >
                        <input
                          type="hidden"
                          name="categoryId"
                          value={category.id}
                        />
                        <button
                          className="table-action"
                          disabled={category._count.products > 0}
                        >
                          Archive
                        </button>
                      </ConfirmForm>
                    )}
                  </div>
                  <details className="admin-inline-edit">
                    <summary>Edit</summary>
                    <AdminForm
                      action={updateCategoryAction}
                      submitLabel="Save category"
                    >
                      <input
                        type="hidden"
                        name="categoryId"
                        value={category.id}
                      />
                      <div className="admin-field-grid">
                        <Field
                          label="German name"
                          name="nameDe"
                          required
                          defaultValue={de?.name}
                        />
                        <Field
                          label="English name"
                          name="nameEn"
                          required
                          defaultValue={en?.name}
                        />
                        <Field
                          label="German slug"
                          name="slugDe"
                          required
                          defaultValue={de?.slug}
                        />
                        <Field
                          label="English slug"
                          name="slugEn"
                          required
                          defaultValue={en?.slug}
                        />
                        <SelectField
                          label="Parent category"
                          name="parentId"
                          defaultValue={category.parentId ?? ""}
                          options={[
                            { value: "", label: "No parent" },
                            ...categories
                              .filter((other) => other.id !== category.id)
                              .map((other) => ({
                                value: other.id,
                                label:
                                  other.translations.find(
                                    (item) => item.locale === "en",
                                  )?.name ?? other.internalName,
                              })),
                          ]}
                        />
                        <TextField
                          label="German description"
                          name="descriptionDe"
                          defaultValue={de?.description}
                        />
                        <TextField
                          label="English description"
                          name="descriptionEn"
                          defaultValue={en?.description}
                        />
                        <Field
                          label="German SEO title"
                          name="seoTitleDe"
                          defaultValue={de?.seoTitle}
                        />
                        <Field
                          label="English SEO title"
                          name="seoTitleEn"
                          defaultValue={en?.seoTitle}
                        />
                        <TextField
                          label="German meta description"
                          name="metaDescriptionDe"
                          defaultValue={de?.metaDescription}
                        />
                        <TextField
                          label="English meta description"
                          name="metaDescriptionEn"
                          defaultValue={en?.metaDescription}
                        />
                      </div>
                    </AdminForm>
                  </details>
                </div>
              );
            })
          ) : (
            <p className="admin-empty">No categories yet.</p>
          )}
        </section>
        <AdminForm action={createCategoryAction} submitLabel="Create category">
          <AdminSection
            title="New category"
            description="German and English content are stored separately."
          >
            <div className="admin-field-grid">
              <Field label="German name" name="nameDe" required />
              <Field label="English name" name="nameEn" required />
              <Field label="German slug" name="slugDe" required />
              <Field label="English slug" name="slugEn" required />
              <SelectField
                label="Parent category"
                name="parentId"
                options={categories.map((category) => ({
                  value: category.id,
                  label:
                    category.translations.find((item) => item.locale === "en")
                      ?.name ?? category.internalName,
                }))}
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
            </div>
          </AdminSection>
        </AdminForm>
      </div>
    </div>
  );
}
