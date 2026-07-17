"use client";

import { useEffect, useState } from "react";
import type {
  Category,
  Product,
  ProductTranslation,
} from "@generated/prisma/client";
import { slugify } from "@/lib/slug";
import { AdminForm } from "./admin-form";

type ProductWithTranslations = Product & {
  translations: ProductTranslation[];
  categories: { categoryId: string }[];
};

const tabs = [
  { id: "basics", label: "Basics" },
  { id: "de", label: "German content" },
  { id: "en", label: "English content" },
  { id: "seo", label: "SEO" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ProductForm({
  product,
  categories,
  action,
}: {
  product?: ProductWithTranslations;
  categories: (Category & { translations: ProductTranslationLike[] })[];
  action: (formData: FormData) => Promise<{
    success: boolean;
    error?: { message: string; fieldErrors?: Record<string, string[]> };
  } | void>;
}) {
  const de = product?.translations.find((item) => item.locale === "de");
  const en = product?.translations.find((item) => item.locale === "en");
  const [tab, setTab] = useState<TabId>("basics");

  // Slugs mirror the name until an operator types their own. An existing slug
  // counts as deliberate, so editing a saved product never rewrites its URL.
  const [nameDe, setNameDe] = useState(de?.name ?? "");
  const [slugDe, setSlugDe] = useState(de?.slug ?? "");
  const [slugDeEdited, setSlugDeEdited] = useState(Boolean(de?.slug));
  const [nameEn, setNameEn] = useState(en?.name ?? "");
  const [slugEn, setSlugEn] = useState(en?.slug ?? "");
  const [slugEnEdited, setSlugEnEdited] = useState(Boolean(en?.slug));

  // The readiness card lives outside this form; it asks us to reveal the tab
  // holding the field it wants to focus before it scrolls to it.
  useEffect(() => {
    const onActivate = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (tabs.some((entry) => entry.id === id)) setTab(id as TabId);
    };
    window.addEventListener("admin:activate-tab", onActivate);
    return () => window.removeEventListener("admin:activate-tab", onActivate);
  }, []);

  return (
    <AdminForm
      action={action}
      submitLabel={product ? "Save draft changes" : "Create draft product"}
    >
      {product && <input type="hidden" name="productId" value={product.id} />}

      <nav className="admin-tabs" aria-label="Product sections">
        {tabs.map((entry) => (
          <button
            type="button"
            key={entry.id}
            className={entry.id === tab ? "active" : ""}
            aria-current={entry.id === tab ? "true" : undefined}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </nav>

      <p className="admin-optional-note">
        Only the internal name is required to save a draft. Everything else can
        be filled in later — publication readiness lists what is still missing
        before this product can go live.
      </p>

      <div
        className="admin-form-tabpanel"
        data-tab-panel="basics"
        hidden={tab !== "basics"}
      >
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
              hint="The only required field. Used to identify this product in the admin."
            />
            <SelectField
              id="rf-categoryId"
              label="Primary category"
              name="categoryId"
              defaultValue={product?.categories[0]?.categoryId ?? ""}
              options={[
                { value: "", label: "No category" },
                ...categories.map((category) => ({
                  value: category.id,
                  label:
                    category.translations.find((item) => item.locale === "en")
                      ?.name ?? category.internalName,
                })),
              ]}
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
      </div>

      <div
        className="admin-form-tabpanel"
        data-tab-panel="de"
        hidden={tab !== "de"}
      >
        <AdminSection
          title="German content"
          description="Required for German publication. No English fallback is used."
        >
          <div className="admin-field-grid">
            <ControlledField
              id="rf-nameDe"
              label="German name"
              name="nameDe"
              value={nameDe}
              onChange={(value) => {
                setNameDe(value);
                if (!slugDeEdited) setSlugDe(slugify(value));
              }}
            />
            <ControlledField
              id="rf-slugDe"
              label="German slug"
              name="slugDe"
              value={slugDe}
              placeholder={slugify(nameDe) || "generated-from-name"}
              hint="Generated from the name. Edit it to set your own."
              onChange={(value) => {
                setSlugDe(value);
                setSlugDeEdited(true);
              }}
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
      </div>

      <div
        className="admin-form-tabpanel"
        data-tab-panel="en"
        hidden={tab !== "en"}
      >
        <AdminSection
          title="English content"
          description="Leave incomplete rather than copying German content."
        >
          <div className="admin-field-grid">
            <ControlledField
              id="rf-nameEn"
              label="English name"
              name="nameEn"
              value={nameEn}
              onChange={(value) => {
                setNameEn(value);
                if (!slugEnEdited) setSlugEn(slugify(value));
              }}
            />
            <ControlledField
              label="English slug"
              name="slugEn"
              value={slugEn}
              placeholder={slugify(nameEn) || "generated-from-name"}
              hint="Generated from the name. Edit it to set your own."
              onChange={(value) => {
                setSlugEn(value);
                setSlugEnEdited(true);
              }}
            />
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
      </div>

      <div
        className="admin-form-tabpanel"
        data-tab-panel="seo"
        hidden={tab !== "seo"}
      >
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
      </div>
    </AdminForm>
  );
}

/** Like Field, but value-controlled so name and slug can stay in sync. */
function ControlledField({
  id,
  label,
  name,
  value,
  onChange,
  hint,
  placeholder,
}: {
  id?: string;
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <small className="admin-field-hint">{hint}</small>}
    </label>
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
