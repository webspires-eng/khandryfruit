"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  CheckboxOption,
  ConsentRow,
  FormErrorBanner,
  HoneypotField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/storefront/form-fields";
import type { AppLocale } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { submitWholesaleApplicationAction } from "@/server/actions/wholesale";

const COUNTRY_CODES = ["DE", "AT", "CH", "NL", "BE", "FR"] as const;
const DELIVERY_COUNTRY_CODES = [
  "DE",
  "AT",
  "CH",
  "NL",
  "BE",
  "FR",
  "OTHER_EU",
] as const;
const BUSINESS_TYPES = [
  "GROCERY_RETAILER",
  "RESTAURANT",
  "CAFE",
  "BAKERY",
  "CONFECTIONER",
  "DISTRIBUTOR",
  "CORPORATE_BUYER",
  "MARKET_TRADER",
  "OTHER",
] as const;
const CONTACT_METHODS = ["EMAIL", "PHONE", "WHATSAPP"] as const;
const VOLUMES = [
  "UP_TO_500",
  "FROM_500_TO_1500",
  "FROM_1500_TO_5000",
  "OVER_5000",
  "UNSURE",
] as const;

type FieldErrors = Record<string, string[]>;

export function WholesaleForm({
  locale,
  productOptions,
  isAuthenticated,
}: {
  locale: AppLocale;
  productOptions: string[];
  isAuthenticated: boolean;
}) {
  const t = useTranslations("wholesaleForm");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | undefined>(
    undefined,
  );
  const [submitted, setSubmitted] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submitted) successRef.current?.scrollIntoView({ block: "start" });
  }, [submitted]);

  const fieldError = (name: string) => fieldErrors?.[name]?.[0];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setFormError(null);
    setFieldErrors(undefined);
    try {
      const result = await submitWholesaleApplicationAction(formData);
      if (result.success) {
        setSubmitted(true);
        return;
      }
      setFormError(result.error.message);
      setFieldErrors(result.error.fieldErrors);
    } catch {
      setFormError(t("errors.generic"));
    } finally {
      setPending(false);
    }
  };

  if (submitted) {
    return (
      <div className="success-panel" role="status" ref={successRef}>
        <h2>{t("successTitle")}</h2>
        <p>{t("successBody")}</p>
        {isAuthenticated && <p>{t("successStatusNote")}</p>}
        <div className="content-actions">
          <Link className="button" href="/" locale={locale}>
            {t("successCtaHome")}
          </Link>
          {isAuthenticated && (
            <Link className="button secondary" href="/account" locale={locale}>
              {t("successCtaAccount")}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="storefront-form" onSubmit={handleSubmit} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <FormErrorBanner message={formError} />
      <fieldset>
        <legend>{t("companySection")}</legend>
        <div className="form-grid">
          <TextField
            label={t("companyName")}
            name="companyName"
            error={fieldError("companyName")}
            wide
            required
            autoComplete="organization"
          />
          <TextField
            label={t("businessAddress")}
            name="businessAddress"
            error={fieldError("businessAddress")}
            wide
            required
            autoComplete="street-address"
          />
          <TextField
            label={t("city")}
            name="city"
            error={fieldError("city")}
            required
            autoComplete="address-level2"
          />
          <TextField
            label={t("postalCode")}
            name="postalCode"
            error={fieldError("postalCode")}
            required
            autoComplete="postal-code"
          />
          <SelectField
            label={t("country")}
            name="countryCode"
            error={fieldError("countryCode")}
            required
            defaultValue="DE"
            placeholder={t("country")}
            options={COUNTRY_CODES.map((code) => ({
              value: code,
              label: t(`countries.${code}`),
            }))}
          />
          <SelectField
            label={t("businessType")}
            name="businessType"
            error={fieldError("businessType")}
            required
            placeholder={t("businessType")}
            options={BUSINESS_TYPES.map((value) => ({
              value,
              label: t(`businessTypes.${value}`),
            }))}
          />
          <TextField
            label={t("vatId")}
            name="vatId"
            error={fieldError("vatId")}
            hint={t("vatHint")}
          />
          <TextField
            label={t("registrationNumber")}
            name="registrationNumber"
            error={fieldError("registrationNumber")}
          />
          <TextField
            label={t("website")}
            name="website"
            type="url"
            error={fieldError("website")}
          />
        </div>
      </fieldset>
      <fieldset>
        <legend>{t("contactSection")}</legend>
        <div className="form-grid">
          <TextField
            label={t("contactName")}
            name="contactName"
            error={fieldError("contactName")}
            required
            autoComplete="name"
          />
          <TextField
            label={t("email")}
            name="email"
            type="email"
            error={fieldError("email")}
            required
            autoComplete="email"
          />
          <TextField
            label={t("phone")}
            name="phone"
            type="tel"
            error={fieldError("phone")}
            hint={t("phoneHint")}
            required
            autoComplete="tel"
          />
          <SelectField
            label={t("preferredContactMethod")}
            name="preferredContactMethod"
            error={fieldError("preferredContactMethod")}
            required
            placeholder={t("preferredContactMethod")}
            options={CONTACT_METHODS.map((value) => ({
              value,
              label: t(`contactMethods.${value}`),
            }))}
          />
        </div>
      </fieldset>
      <fieldset>
        <legend>{t("businessSection")}</legend>
        <div className="form-grid">
          <SelectField
            label={t("monthlyOrderVolume")}
            name="monthlyOrderVolume"
            error={fieldError("monthlyOrderVolume")}
            required
            wide
            placeholder={t("monthlyOrderVolume")}
            options={VOLUMES.map((value) => ({
              value,
              label: t(`volumes.${value}`),
            }))}
          />
          <div
            className="field wide"
            role="group"
            aria-label={t("productsOfInterest")}
          >
            <span>{t("productsOfInterest")} *</span>
            <div className="checkbox-grid">
              {productOptions.map((option) => (
                <CheckboxOption
                  key={option}
                  name="productsOfInterest"
                  value={option}
                  label={option}
                />
              ))}
            </div>
            {fieldError("productsOfInterest") && (
              <span className="field-error" role="alert">
                {fieldError("productsOfInterest")}
              </span>
            )}
          </div>
          <div
            className="field wide"
            role="group"
            aria-label={t("deliveryCountries")}
          >
            <span>{t("deliveryCountries")} *</span>
            <div className="checkbox-grid">
              {DELIVERY_COUNTRY_CODES.map((code) => (
                <CheckboxOption
                  key={code}
                  name="deliveryCountries"
                  value={code}
                  label={t(`countries.${code}`)}
                  defaultChecked={code === "DE"}
                />
              ))}
            </div>
            {fieldError("deliveryCountries") && (
              <span className="field-error" role="alert">
                {fieldError("deliveryCountries")}
              </span>
            )}
          </div>
          <TextAreaField
            label={t("message")}
            name="message"
            error={fieldError("message")}
            wide
            rows={5}
            maxLength={2000}
            placeholder={t("messagePlaceholder")}
          />
        </div>
      </fieldset>
      <HoneypotField name="faxNumber" label="Fax" />
      <ConsentRow
        name="agreement"
        label={t("agreement")}
        error={fieldError("agreement")}
      />
      <ConsentRow
        name="accuracyConfirmed"
        label={t("accuracy")}
        error={fieldError("accuracyConfirmed")}
      />
      <button className="button full" type="submit" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
