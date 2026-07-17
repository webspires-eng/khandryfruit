import type {
  Category,
  Product,
  ProductTranslation,
} from "@generated/prisma/client";
import { AdminForm } from "./admin-form";

type ProductWithTranslations = Product & {
  translations: ProductTranslation[];
  categories: { categoryId: string }[];
};
export function ProductForm({
  product,
  categories,
  action,
}: {
  product?: ProductWithTranslations;
  categories: (Category & { translations: ProductTranslationLike[] })[];
  action: (
    formData: FormData,
  ) => Promise<{
    success: boolean;
    error?: { message: string; fieldErrors?: Record<string, string[]> };
  } | void>;
}) {
  const de = product?.translations.find((item) => item.locale === "de");
  const en = product?.translations.find((item) => item.locale === "en");
  return (
    <AdminForm
      action={action}
      submitLabel={product ? "Save draft changes" : "Create draft product"}
    >
      {product && <input type="hidden" name="productId" value={product.id} />}
      <AdminSection
        title="Basic details"
        description="Internal identification and storefront flags."
      >
        <div className="admin-field-grid">
          <Field
            label="Internal name"
            name="internalName"
            required
            defaultValue={product?.internalName}
          />
          <SelectField
            id="rf-categoryId"
            label="Primary category"
            name="categoryId"
            required
            defaultValue={product?.categories[0]?.categoryId}
            options={categories.map((category) => ({
              value: category.id,
              label:
                category.translations.find((item) => item.locale === "en")
                  ?.name ?? category.internalName,
            }))}
          />
          <Field
            id="rf-countryOfOrigin"
            label="Country of origin"
            name="countryOfOrigin"
            defaultValue={product?.countryOfOrigin ?? ""}
          />
          <Field
            label="Region of origin"
            name="regionOfOrigin"
            defaultValue={product?.regionOfOrigin ?? ""}
          />
          <Field
            id="rf-responsibleFoodBusiness"
            label="Responsible food business"
            name="responsibleFoodBusiness"
            defaultValue={product?.responsibleFoodBusiness ?? ""}
            wide
          />
          <Checkbox
            name="featured"
            label="Featured product"
            defaultChecked={product?.featured}
          />
          <Checkbox
            name="bestseller"
            label="Bestseller"
            defaultChecked={product?.bestseller}
          />
          <Checkbox
            name="newProduct"
            label="New product"
            defaultChecked={product?.newProduct}
          />
          <Checkbox
            name="giftSuitable"
            label="Suitable for gifts"
            defaultChecked={product?.giftSuitable}
          />
        </div>
      </AdminSection>
      <AdminSection
        title="German content"
        description="Required for German publication. No English fallback is used."
      >
        <div className="admin-field-grid">
          <Field
            id="rf-nameDe"
            label="German name"
            name="nameDe"
            required
            defaultValue={de?.name}
          />
          <Field
            id="rf-slugDe"
            label="German slug"
            name="slugDe"
            required
            defaultValue={de?.slug}
          />
          <TextField
            label="Short description"
            name="shortDescriptionDe"
            defaultValue={de?.shortDescription}
          />
          <TextField
            label="Full description"
            name="descriptionDe"
            defaultValue={de?.description}
            rows={6}
          />
          <TextField
            id="rf-ingredientsDe"
            label="Ingredients"
            name="ingredientsDe"
            defaultValue={de?.ingredients}
          />
          <TextField
            id="rf-allergenDe"
            label="Allergen information"
            name="allergenDe"
            defaultValue={de?.allergenStatement}
          />
          <TextField
            id="rf-storageDe"
            label="Storage instructions"
            name="storageDe"
            defaultValue={de?.storageInstructions}
          />
        </div>
      </AdminSection>
      <AdminSection
        title="English content"
        description="Leave incomplete rather than copying German content."
      >
        <div className="admin-field-grid">
          <Field
            id="rf-nameEn"
            label="English name"
            name="nameEn"
            defaultValue={en?.name}
          />
          <Field label="English slug" name="slugEn" defaultValue={en?.slug} />
          <TextField
            label="Short description"
            name="shortDescriptionEn"
            defaultValue={en?.shortDescription}
          />
          <TextField
            label="Full description"
            name="descriptionEn"
            defaultValue={en?.description}
            rows={6}
          />
          <TextField
            id="rf-ingredientsEn"
            label="Ingredients"
            name="ingredientsEn"
            defaultValue={en?.ingredients}
          />
          <TextField
            label="Allergen information"
            name="allergenEn"
            defaultValue={en?.allergenStatement}
          />
          <TextField
            label="Storage instructions"
            name="storageEn"
            defaultValue={en?.storageInstructions}
          />
        </div>
      </AdminSection>
      <AdminSection
        title="Search engine information"
        description="Separate metadata is stored for each locale."
      >
        <div className="admin-field-grid">
          <Field
            id="rf-seoTitleDe"
            label="German SEO title"
            name="seoTitleDe"
            defaultValue={de?.seoTitle}
          />
          <Field
            id="rf-seoTitleEn"
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
      </AdminSection>
    </AdminForm>
  );
}

type ProductTranslationLike = { locale: "de" | "en"; name: string };
export function AdminSection({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="admin-form-section">
      <header>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  );
}
export function Field({
  id,
  label,
  name,
  defaultValue,
  required,
  type = "text",
  wide,
  min,
  max,
  hint,
  placeholder,
}: {
  id?: string;
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  wide?: boolean;
  min?: number;
  max?: number;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className={wide ? "admin-field wide" : "admin-field"}>
      <span>
        {label}
        {required && <b aria-hidden="true"> *</b>}
      </span>
      <input
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        type={type}
        min={min}
        max={max}
        placeholder={placeholder}
      />
      {hint && <small className="admin-field-hint">{hint}</small>}
    </label>
  );
}
export function TextField({
  id,
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  id?: string;
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="admin-field wide">
      <span>{label}</span>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue ?? ""}
        rows={rows}
      />
    </label>
  );
}
export function SelectField({
  id,
  label,
  name,
  options,
  defaultValue,
  required,
}: {
  id?: string;
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        required={required}
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="admin-checkbox">
      <input
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={defaultChecked}
      />
      <span>{label}</span>
    </label>
  );
}
