"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  ConsentRow,
  FormErrorBanner,
  HoneypotField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/storefront/form-fields";
import { Link } from "@/i18n/navigation";
import { submitContactEnquiryAction } from "@/server/actions/contact";

const ENQUIRY_TYPES = [
  "GENERAL",
  "ORDER",
  "PRODUCT",
  "DELIVERY",
  "WHOLESALE",
  "GIFT_BOXES",
  "RETURNS",
  "OTHER",
] as const;

const CONTACT_METHODS = ["EMAIL", "PHONE", "WHATSAPP"] as const;

/** Enquiry types for which an order number is relevant. */
const ORDER_NUMBER_TYPES: ReadonlyArray<string> = [
  "ORDER",
  "RETURNS",
  "DELIVERY",
];

export function ContactForm({ locale }: { locale: "de" | "en" }) {
  const t = useTranslations("contact.form");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [selectedType, setSelectedType] = useState<string>("GENERAL");

  const fieldError = (name: string) => fieldErrors[name]?.[0];

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});
    const formData = new FormData(event.currentTarget);
    const result = await submitContactEnquiryAction(formData);
    if (result.success) {
      setSubmitted(true);
      return;
    }
    setError(result.error.message);
    setFieldErrors(result.error.fieldErrors ?? {});
    setPending(false);
  };

  if (submitted) {
    return (
      <div className="success-panel" role="status">
        <h2>{t("successTitle")}</h2>
        <p>{t("successBody")}</p>
        <div className="content-actions">
          <Link className="button" href="/" locale={locale}>
            {t("successCta")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="storefront-form" onSubmit={submit} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <FormErrorBanner message={error} />
      <div className="form-grid">
        <TextField
          label={t("name")}
          name="name"
          autoComplete="name"
          required
          error={fieldError("name")}
        />
        <TextField
          label={t("email")}
          name="email"
          type="email"
          autoComplete="email"
          required
          error={fieldError("email")}
        />
        <TextField
          label={t("phone")}
          name="phone"
          type="tel"
          autoComplete="tel"
          error={fieldError("phone")}
        />
        <SelectField
          label={t("preferredContactMethod")}
          name="preferredContactMethod"
          required
          defaultValue="EMAIL"
          options={CONTACT_METHODS.map((method) => ({
            value: method,
            label: t(`methods.${method}`),
          }))}
          error={fieldError("preferredContactMethod")}
        />
        <SelectField
          label={t("type")}
          name="type"
          required
          defaultValue="GENERAL"
          options={ENQUIRY_TYPES.map((type) => ({
            value: type,
            label: t(`types.${type}`),
          }))}
          onChange={(event) => setSelectedType(event.currentTarget.value)}
          error={fieldError("type")}
        />
        {ORDER_NUMBER_TYPES.includes(selectedType) && (
          <TextField
            label={t("orderNumber")}
            name="orderNumber"
            hint={t("orderNumberHint")}
            error={fieldError("orderNumber")}
          />
        )}
        <TextField
          label={t("subject")}
          name="subject"
          required
          wide
          error={fieldError("subject")}
        />
        <TextAreaField
          label={t("message")}
          name="message"
          required
          wide
          maxLength={2000}
          rows={6}
          error={fieldError("message")}
        />
        <HoneypotField name="website" label="Website" />
        <ConsentRow
          name="consent"
          label={t("consent")}
          error={fieldError("consent")}
        />
        <button className="button full" type="submit" disabled={pending}>
          {pending ? t("submitting") : t("submit")}
        </button>
      </div>
    </form>
  );
}
