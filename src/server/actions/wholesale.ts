"use server";

import { z } from "zod";

import { isLocale, type AppLocale } from "@/config/site";
import { getEmailProvider } from "@/lib/email/provider";
import {
  buildWholesaleAdminEmail,
  buildWholesaleReceivedEmail,
} from "@/lib/email/templates";
import { ACTIVE_APPLICATION_STATUSES } from "@/lib/commerce/wholesale";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { localizeFieldErrors, translate } from "@/lib/i18n/translate";
import { logger } from "@/lib/logging/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  wholesaleApplicationSchema,
  type ActionResult,
} from "@/lib/validation/schemas";
import { publicRequestMeta } from "@/server/actions/shared";
import { getSession } from "@/server/policies/authorization";

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60_000 };

function formLocale(formData: FormData): AppLocale {
  const raw = String(formData.get("locale") ?? "de");
  return isLocale(raw) ? raw : "de";
}

export async function submitWholesaleApplicationAction(
  formData: FormData,
): Promise<ActionResult<{ applicationId: string }>> {
  const locale = formLocale(formData);
  const meta = await publicRequestMeta();
  try {
    // Honeypot: bots that fill the hidden field get a quiet "success" so they
    // do not learn to adapt; nothing is stored or sent.
    const honeypot = String(formData.get("faxNumber") ?? "");
    if (honeypot.length > 0) {
      logger.warn("wholesale_honeypot_triggered", {
        correlationId: meta.correlationId,
      });
      return { success: true, data: { applicationId: "received" } };
    }

    const rate = await checkRateLimit(
      `wholesale:${meta.ipAddress}`,
      RATE_LIMIT,
    );
    if (!rate.allowed)
      return failure(
        "RATE_LIMITED",
        translate(locale, "wholesaleForm.errors.rateLimited"),
      );

    const parsed = wholesaleApplicationSchema.safeParse({
      locale,
      companyName: text(formData, "companyName"),
      contactName: text(formData, "contactName"),
      email: text(formData, "email").toLowerCase(),
      phone: text(formData, "phone").replace(/[\s()/-]/g, ""),
      businessAddress: text(formData, "businessAddress"),
      city: text(formData, "city"),
      postalCode: text(formData, "postalCode"),
      countryCode: text(formData, "countryCode"),
      vatId: optionalText(formData, "vatId"),
      registrationNumber: optionalText(formData, "registrationNumber"),
      businessType: text(formData, "businessType"),
      website: optionalText(formData, "website") ?? "",
      monthlyOrderVolume: text(formData, "monthlyOrderVolume"),
      productsOfInterest: formData.getAll("productsOfInterest").map(String),
      deliveryCountries: formData.getAll("deliveryCountries").map(String),
      preferredContactMethod: text(formData, "preferredContactMethod"),
      message: optionalText(formData, "message"),
      agreement: formData.get("agreement") === "true",
      accuracyConfirmed: formData.get("accuracyConfirmed") === "true",
      faxNumber: honeypot,
    });
    if (!parsed.success)
      return failure(
        "VALIDATION_ERROR",
        translate(locale, "wholesaleForm.errors.generic"),
        localizeFieldErrors(parsed.error, locale),
      );
    const input = parsed.data;

    if (!env.DATABASE_URL)
      return failure(
        "DATABASE_NOT_CONFIGURED",
        translate(locale, "wholesaleForm.errors.generic"),
      );

    const duplicate = await db.wholesaleApplication.findFirst({
      where: {
        email: { equals: input.email, mode: "insensitive" },
        status: { in: [...ACTIVE_APPLICATION_STATUSES] },
      },
      select: { id: true },
    });
    if (duplicate)
      return failure(
        "DUPLICATE_APPLICATION",
        translate(locale, "wholesaleForm.errors.duplicate"),
      );

    const session = await getSession();
    const now = new Date();
    const application = await db.$transaction(async (tx) => {
      const created = await tx.wholesaleApplication.create({
        data: {
          userId: session?.user.id ?? null,
          companyName: input.companyName,
          contactName: input.contactName,
          email: input.email,
          phone: input.phone,
          businessAddress: input.businessAddress,
          city: input.city,
          postalCode: input.postalCode,
          countryCode: input.countryCode,
          vatId: input.vatId || null,
          registrationNumber: input.registrationNumber || null,
          businessType: input.businessType,
          website: input.website || null,
          monthlyOrderVolume: input.monthlyOrderVolume,
          productsOfInterest: input.productsOfInterest,
          deliveryCountries: input.deliveryCountries,
          preferredContactMethod: input.preferredContactMethod,
          message: input.message || null,
          status: "SUBMITTED",
          agreementAcceptedAt: now,
          accuracyConfirmedAt: now,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: session?.user.id ?? null,
          action: "WHOLESALE_APPLICATION_SUBMITTED",
          entityType: "WholesaleApplication",
          entityId: created.id,
          after: { status: "SUBMITTED", companyName: input.companyName },
          ipAddress: meta.ipAddress,
          correlationId: meta.correlationId,
        },
      });
      return created;
    });

    await sendWholesaleEmails(
      locale,
      application.id,
      input,
      meta.correlationId,
    );

    logger.info("wholesale_application_submitted", {
      correlationId: meta.correlationId,
      applicationId: application.id,
    });
    return { success: true, data: { applicationId: application.id } };
  } catch (error) {
    logger.error("wholesale_application_failed", {
      correlationId: meta.correlationId,
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return failure(
      "SUBMISSION_FAILED",
      translate(locale, "wholesaleForm.errors.generic"),
    );
  }
}

async function sendWholesaleEmails(
  locale: AppLocale,
  applicationId: string,
  input: z.infer<typeof wholesaleApplicationSchema>,
  correlationId: string,
) {
  const provider = getEmailProvider();
  const reference = applicationId.slice(-8).toUpperCase();
  try {
    await provider.send(
      buildWholesaleReceivedEmail({
        locale,
        to: input.email,
        contactName: input.contactName,
        companyName: input.companyName,
        reference,
      }),
    );
  } catch {
    logger.error("wholesale_confirmation_email_failed", { correlationId });
  }
  // Never notify a placeholder inbox from production traffic.
  if (
    env.NODE_ENV === "production" &&
    env.ADMIN_EMAIL === "orders@example.com"
  ) {
    logger.warn("wholesale_admin_email_skipped_placeholder", { correlationId });
    return;
  }
  try {
    await provider.send(
      buildWholesaleAdminEmail({
        to: env.ADMIN_EMAIL,
        companyName: input.companyName,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        businessType: input.businessType,
        city: input.city,
        countryCode: input.countryCode,
        monthlyOrderVolume: input.monthlyOrderVolume,
        applicationId,
      }),
    );
  } catch {
    logger.error("wholesale_admin_email_failed", { correlationId });
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
