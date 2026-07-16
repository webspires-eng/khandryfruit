import type { ZodError } from "zod";

import type { AppLocale } from "@/config/site";

import de from "../../../messages/de.json";
import en from "../../../messages/en.json";

const catalogs: Record<AppLocale, unknown> = { de, en };

/**
 * Message lookup against the shared translation catalogues for code that runs
 * outside a next-intl request scope (server actions, email templates, tests).
 * Supports simple `{variable}` interpolation; ICU plural syntax is not needed
 * here and stays with next-intl.
 */
export function translate(
  locale: AppLocale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let node: unknown = catalogs[locale];
  for (const segment of key.split(".")) {
    if (typeof node !== "object" || node === null) return key;
    node = (node as Record<string, unknown>)[segment];
  }
  if (typeof node !== "string") return key;
  if (!vars) return node;
  return node.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * Convert a ZodError whose issue messages are translation keys (e.g.
 * "validation.email") into localized, field-keyed messages for display next
 * to form fields. Non-key messages fall back to the generic required text.
 */
export function localizeFieldErrors(
  error: ZodError,
  locale: AppLocale,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.length ? String(issue.path[0]) : "form";
    const key = issue.message.startsWith("validation.")
      ? issue.message
      : "validation.required";
    const message = translate(locale, key);
    fieldErrors[field] = fieldErrors[field] ?? [];
    if (!fieldErrors[field].includes(message)) fieldErrors[field].push(message);
  }
  return fieldErrors;
}
