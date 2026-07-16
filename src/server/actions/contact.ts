"use server";

import { z } from "zod";

import { isLocale, type AppLocale } from "@/config/site";
import { getEmailProvider } from "@/lib/email/provider";
import {
  buildContactAdminEmail,
  buildContactReceivedEmail,
} from "@/lib/email/templates";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { localizeFieldErrors, translate } from "@/lib/i18n/translate";
import { logger } from "@/lib/logging/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { contactSchema, type ActionResult } from "@/lib/validation/schemas";
import { publicRequestMeta } from "@/server/actions/shared";
import { getSession } from "@/server/policies/authorization";

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60_000 };

function formLocale(formData: FormData): AppLocale {
  const raw = String(formData.get("locale") ?? "de");
  return isLocale(raw) ? raw : "de";
}

export async function submitContactEnquiryAction(
  formData: FormData,
): Promise<ActionResult<{ enquiryId: string }>> {
  const locale = formLocale(formData);
  const meta = await publicRequestMeta();
  try {
    // Honeypot: quiet "success" for bots, nothing stored or sent.
    const honeypot = String(formData.get("website") ?? "");
    if (honeypot.length > 0) {
      logger.warn("contact_honeypot_triggered", {
        correlationId: meta.correlationId,
      });
      return { success: true, data: { enquiryId: "received" } };
    }

    const rate = checkRateLimit(`contact:${meta.ipAddress}`, RATE_LIMIT);
    if (!rate.allowed)
      return failure(
        "RATE_LIMITED",
        translate(locale, "contact.form.errors.rateLimited"),
      );

    const parsed = contactSchema.safeParse({
      locale,
      name: text(formData, "name"),
      email: text(formData, "email").toLowerCase(),
      phone: optionalText(formData, "phone"),
      orderNumber: optionalText(formData, "orderNumber"),
      type: text(formData, "type"),
      subject: text(formData, "subject"),
      message: text(formData, "message"),
      preferredContactMethod: text(formData, "preferredContactMethod"),
      consent: formData.get("consent") === "true",
      website: honeypot,
    });
    if (!parsed.success)
      return failure(
        "VALIDATION_ERROR",
        translate(locale, "contact.form.errors.generic"),
        localizeFieldErrors(parsed.error, locale),
      );
    const input = parsed.data;

    if (!env.DATABASE_URL)
      return failure(
        "DATABASE_NOT_CONFIGURED",
        translate(locale, "contact.form.errors.generic"),
      );

    const session = await getSession();
    const enquiry = await db.$transaction(async (tx) => {
      const created = await tx.contactEnquiry.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone || null,
          orderNumber: input.orderNumber || null,
          type: input.type,
          subject: input.subject,
          message: input.message,
          preferredContactMethod: input.preferredContactMethod,
          status: "NEW",
          locale,
          consentAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session?.user.id ?? null,
          action: "CONTACT_ENQUIRY_SUBMITTED",
          entityType: "ContactEnquiry",
          entityId: created.id,
          after: { type: input.type },
          ipAddress: meta.ipAddress,
          correlationId: meta.correlationId,
        },
      });
      return created;
    });

    await sendContactEmails(locale, enquiry.id, input, meta.correlationId);

    logger.info("contact_enquiry_submitted", {
      correlationId: meta.correlationId,
      enquiryId: enquiry.id,
      type: input.type,
    });
    return { success: true, data: { enquiryId: enquiry.id } };
  } catch (error) {
    logger.error("contact_enquiry_failed", {
      correlationId: meta.correlationId,
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return failure(
      "SUBMISSION_FAILED",
      translate(locale, "contact.form.errors.generic"),
    );
  }
}

async function sendContactEmails(
  locale: AppLocale,
  enquiryId: string,
  input: z.infer<typeof contactSchema>,
  correlationId: string,
) {
  const provider = getEmailProvider();
  try {
    await provider.send(
      buildContactReceivedEmail({
        locale,
        to: input.email,
        name: input.name,
        type: input.type,
        subject: input.subject,
      }),
    );
  } catch {
    logger.error("contact_confirmation_email_failed", { correlationId });
  }
  // Never notify a placeholder inbox from production traffic.
  if (env.NODE_ENV === "production" && env.ADMIN_EMAIL === "orders@example.com") {
    logger.warn("contact_admin_email_skipped_placeholder", { correlationId });
    return;
  }
  try {
    await provider.send(
      buildContactAdminEmail({
        to: env.ADMIN_EMAIL,
        name: input.name,
        email: input.email,
        type: input.type,
        subject: input.subject,
        orderNumber: input.orderNumber,
        enquiryId,
      }),
    );
  } catch {
    logger.error("contact_admin_email_failed", { correlationId });
  }
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optionalText(formData: FormData, key: string): string | undefined {
  const value = text(formData, key);
  return value.length ? value : undefined;
}

function failure(
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { success: false, error: { code, message, fieldErrors } };
}
