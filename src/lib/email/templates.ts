import type { AppLocale } from "@/config/site";
import { siteConfig } from "@/config/site";
import { translate } from "@/lib/i18n/translate";

import type { EmailMessage } from "./provider";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function layout(locale: AppLocale, paragraphs: string[]): string {
  const footer = escapeHtml(translate(locale, "emails.footer"));
  const body = paragraphs.map((p) => `<p>${p}</p>`).join("");
  return `<div style="font-family:Georgia,serif;max-width:36rem;margin:0 auto;color:#28251f"><h2 style="color:#315b3b">${escapeHtml(siteConfig.name)}</h2>${body}<hr style="border:none;border-top:1px solid #ddd;margin:1.5rem 0"><p style="font-size:.8rem;color:#75643d">${footer}</p></div>`;
}

function toText(paragraphs: string[], locale: AppLocale): string {
  return [...paragraphs, translate(locale, "emails.footer")].join("\n\n");
}

export function buildWholesaleReceivedEmail(input: {
  locale: AppLocale;
  to: string;
  contactName: string;
  companyName: string;
  reference: string;
}): EmailMessage {
  const { locale } = input;
  const t = (key: string, vars?: Record<string, string>) =>
    translate(locale, `emails.wholesaleReceived.${key}`, vars);
  const paragraphs = [
    t("greeting", { name: input.contactName }),
    t("intro", { company: input.companyName }),
    t("timeline"),
    t("reference", { reference: input.reference }),
    t("outro"),
    t("signature"),
  ];
  return {
    to: input.to,
    locale,
    subject: t("subject"),
    text: toText(paragraphs, locale),
    html: layout(locale, paragraphs.map(escapeHtml)),
  };
}

export function buildWholesaleAdminEmail(input: {
  to: string;
  locale?: AppLocale;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: string;
  city: string;
  countryCode: string;
  monthlyOrderVolume: string;
  applicationId: string;
}): EmailMessage {
  const locale = input.locale ?? "de";
  const t = (key: string, vars?: Record<string, string>) =>
    translate(locale, `emails.wholesaleAdmin.${key}`, vars);
  const details = [
    `${input.companyName} (${input.businessType})`,
    `${input.contactName} · ${input.email} · ${input.phone}`,
    `${input.city}, ${input.countryCode}`,
    `Volume: ${input.monthlyOrderVolume}`,
    `ID: ${input.applicationId}`,
  ];
  const paragraphs = [t("intro"), ...details, t("action")];
  return {
    to: input.to,
    locale,
    subject: t("subject", { company: input.companyName }),
    text: toText(paragraphs, locale),
    html: layout(locale, paragraphs.map(escapeHtml)),
  };
}

export function buildContactReceivedEmail(input: {
  locale: AppLocale;
  to: string;
  name: string;
  type: string;
  subject: string;
}): EmailMessage {
  const { locale } = input;
  const t = (key: string, vars?: Record<string, string>) =>
    translate(locale, `emails.contactReceived.${key}`, vars);
  const typeLabel = translate(locale, `contact.form.types.${input.type}`);
  const paragraphs = [
    t("greeting", { name: input.name }),
    t("intro"),
    t("summary", { type: typeLabel, subject: input.subject }),
    t("outro"),
    t("signature"),
  ];
  return {
    to: input.to,
    locale,
    subject: t("subject"),
    text: toText(paragraphs, locale),
    html: layout(locale, paragraphs.map(escapeHtml)),
  };
}

export function buildContactAdminEmail(input: {
  to: string;
  locale?: AppLocale;
  name: string;
  email: string;
  type: string;
  subject: string;
  orderNumber?: string;
  enquiryId: string;
}): EmailMessage {
  const locale = input.locale ?? "de";
  const t = (key: string, vars?: Record<string, string>) =>
    translate(locale, `emails.contactAdmin.${key}`, vars);
  const typeLabel = translate(locale, `contact.form.types.${input.type}`);
  const details = [
    `${input.name} · ${input.email}`,
    `${typeLabel}${input.orderNumber ? ` · ${input.orderNumber}` : ""}`,
    `ID: ${input.enquiryId}`,
  ];
  const paragraphs = [t("intro"), ...details, t("action")];
  return {
    to: input.to,
    locale,
    subject: t("subject", { subject: input.subject }),
    text: toText(paragraphs, locale),
    html: layout(locale, paragraphs.map(escapeHtml)),
  };
}
