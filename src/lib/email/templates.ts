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

/**
 * Customer-facing notification for an order status change, sent whenever an
 * administrator moves the order forward or payment is confirmed. Tracking
 * details are appended when the shipment carries them.
 */
export function buildOrderStatusEmail(input: {
  locale: AppLocale;
  to: string;
  customerName: string;
  orderNumber: string;
  status: string;
  total?: string;
  tracking?: { provider: string; number: string; url?: string | null };
}): EmailMessage {
  const { locale } = input;
  const t = (key: string, vars?: Record<string, string>) =>
    translate(locale, `emails.orderStatus.${key}`, vars);
  const statusLabel = t(`statusLabel.${input.status}`);
  const intro = t(`intro.${input.status}`, { order: input.orderNumber });
  const paragraphs = [
    t("greeting", { name: input.customerName }),
    intro,
    ...(input.total ? [t("total", { total: input.total })] : []),
    ...(input.tracking
      ? [
          t("tracking", {
            provider: input.tracking.provider,
            number: input.tracking.number,
          }),
          ...(input.tracking.url
            ? [t("trackingUrl", { url: input.tracking.url })]
            : []),
        ]
      : []),
    t("outro"),
    t("signature"),
  ];
  return {
    to: input.to,
    locale,
    subject: t("subject", {
      order: input.orderNumber,
      status: statusLabel,
    }),
    text: toText(paragraphs, locale),
    html: layout(locale, paragraphs.map(escapeHtml)),
  };
}

/** True when a status has customer-facing copy worth emailing about. */
export function hasOrderStatusEmail(locale: AppLocale, status: string) {
  return (
    translate(locale, `emails.orderStatus.intro.${status}`) !==
    `emails.orderStatus.intro.${status}`
  );
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

/** One order line rendered for both the HTML table and the text fallback. */
export type OrderEmailLine = {
  name: string;
  detail?: string;
  quantity: number;
  total: string;
};

export type OrderEmailTotals = {
  subtotal: string;
  discount?: string;
  shipping: string;
  tax: string;
  total: string;
};

/** Line-item table matching the plain layout — no images, no external assets. */
function lineTable(
  lines: OrderEmailLine[],
  totals: OrderEmailTotals,
  locale: AppLocale,
) {
  const t = (key: string) =>
    escapeHtml(translate(locale, `emails.order.${key}`));
  const rows = lines
    .map(
      (line) =>
        `<tr><td style="padding:.5rem 0;border-bottom:1px solid #eee">${line.quantity}× ${escapeHtml(line.name)}${
          line.detail
            ? `<br><span style="font-size:.78rem;color:#75643d">${escapeHtml(line.detail)}</span>`
            : ""
        }</td><td style="padding:.5rem 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">${escapeHtml(line.total)}</td></tr>`,
    )
    .join("");
  const summaryRow = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:.25rem 0;${bold ? "font-weight:700" : "color:#75643d"}">${label}</td><td style="padding:.25rem 0;text-align:right;${bold ? "font-weight:700" : ""}">${escapeHtml(value)}</td></tr>`;
  return `<table style="width:100%;border-collapse:collapse;font-size:.9rem;margin:1rem 0">${rows}${
    totals.discount ? summaryRow(t("discount"), `−${totals.discount}`) : ""
  }${summaryRow(t("subtotal"), totals.subtotal)}${summaryRow(t("shipping"), totals.shipping)}${summaryRow(t("tax"), totals.tax)}${summaryRow(t("total"), totals.total, true)}</table>`;
}

function lineText(
  lines: OrderEmailLine[],
  totals: OrderEmailTotals,
  locale: AppLocale,
) {
  const t = (key: string) => translate(locale, `emails.order.${key}`);
  const items = lines
    .map(
      (l) =>
        `  ${l.quantity}× ${l.name}${l.detail ? ` (${l.detail})` : ""} — ${l.total}`,
    )
    .join("\n");
  return [
    items,
    `  ${t("subtotal")}: ${totals.subtotal}`,
    ...(totals.discount ? [`  ${t("discount")}: −${totals.discount}`] : []),
    `  ${t("shipping")}: ${totals.shipping}`,
    `  ${t("tax")}: ${totals.tax}`,
    `  ${t("total")}: ${totals.total}`,
  ].join("\n");
}

/**
 * Full order receipt sent to the customer once payment is confirmed.
 *
 * Separate from the status-change notification: this one carries what the
 * customer actually bought, so it works as the record of the purchase.
 */
export function buildOrderReceiptEmail(input: {
  locale: AppLocale;
  to: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  lines: OrderEmailLine[];
  totals: OrderEmailTotals;
  deliveryAddress: string[];
  orderUrl?: string;
}): EmailMessage {
  const { locale } = input;
  const t = (key: string, vars?: Record<string, string>) =>
    translate(locale, `emails.order.receipt.${key}`, vars);
  const address = input.deliveryAddress.join("\n");
  const intro = [
    t("greeting", { name: input.customerName }),
    t("intro", { order: input.orderNumber }),
  ];
  const outro = [
    `${translate(locale, "emails.order.deliveryTo")}:\n${address}`,
    ...(input.orderUrl ? [t("track", { url: input.orderUrl })] : []),
    t("outro"),
    t("signature"),
  ];
  return {
    to: input.to,
    locale,
    subject: t("subject", { order: input.orderNumber }),
    text: [
      ...intro,
      lineText(input.lines, input.totals, locale),
      ...outro,
      translate(locale, "emails.footer"),
    ].join("\n\n"),
    html: `<div style="font-family:Georgia,serif;max-width:36rem;margin:0 auto;color:#28251f"><h2 style="color:#315b3b">${escapeHtml(siteConfig.name)}</h2>${intro
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("")}${lineTable(input.lines, input.totals, locale)}${outro
      .map((p) => `<p>${escapeHtml(p).replaceAll("\n", "<br>")}</p>`)
      .join(
        "",
      )}<hr style="border:none;border-top:1px solid #ddd;margin:1.5rem 0"><p style="font-size:.8rem;color:#75643d">${escapeHtml(translate(locale, "emails.footer"))}</p></div>`,
  };
}

/** New-order alert for the shop, so nobody has to watch the admin panel. */
export function buildNewOrderAdminEmail(input: {
  to: string;
  locale?: AppLocale;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  lines: OrderEmailLine[];
  totals: OrderEmailTotals;
  deliveryAddress: string[];
  adminUrl: string;
}): EmailMessage {
  const locale = input.locale ?? "de";
  const t = (key: string, vars?: Record<string, string>) =>
    translate(locale, `emails.order.admin.${key}`, vars);
  const intro = [
    t("intro", { order: input.orderNumber, total: input.totals.total }),
    `${input.customerName} · ${input.customerEmail}`,
  ];
  const outro = [
    `${translate(locale, "emails.order.deliveryTo")}:\n${input.deliveryAddress.join("\n")}`,
    t("action", { url: input.adminUrl }),
  ];
  return {
    to: input.to,
    locale,
    subject: t("subject", {
      order: input.orderNumber,
      total: input.totals.total,
    }),
    text: [
      ...intro,
      lineText(input.lines, input.totals, locale),
      ...outro,
      translate(locale, "emails.footer"),
    ].join("\n\n"),
    html: `<div style="font-family:Georgia,serif;max-width:36rem;margin:0 auto;color:#28251f"><h2 style="color:#315b3b">${escapeHtml(siteConfig.name)}</h2>${intro
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("")}${lineTable(input.lines, input.totals, locale)}${outro
      .map((p) => `<p>${escapeHtml(p).replaceAll("\n", "<br>")}</p>`)
      .join(
        "",
      )}<hr style="border:none;border-top:1px solid #ddd;margin:1.5rem 0"><p style="font-size:.8rem;color:#75643d">${escapeHtml(translate(locale, "emails.footer"))}</p></div>`,
  };
}
