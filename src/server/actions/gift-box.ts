"use server";

import { z } from "zod";

import { GiftBoxValidationError } from "@/lib/commerce/gift-box";
import { localizeFieldErrors, translate } from "@/lib/i18n/translate";
import { logger } from "@/lib/logging/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  giftBoxConfigurationSchema,
  giftOccasionValues,
  localeSchema,
  type ActionResult,
} from "@/lib/validation/schemas";
import type { AppLocale } from "@/config/site";
import { publicRequestMeta } from "@/server/actions/shared";
import {
  createFixedGiftBoxConfiguration,
  createGiftBoxConfiguration,
} from "@/server/services/gift-box";
import { CommerceError } from "@/server/services/checkout";
import { getSession } from "@/server/policies/authorization";
import type { GiftBoxCartLine } from "@/types/gift-box";

const RATE_LIMIT = { limit: 20, windowMs: 10 * 60_000 };

function validationMessage(
  locale: AppLocale,
  error: GiftBoxValidationError,
): string {
  const keys: Record<GiftBoxValidationError["code"], string> = {
    TEMPLATE_UNAVAILABLE: "giftBoxBuilder.validation.generic",
    MIN_ITEMS: "giftBoxBuilder.validation.minItems",
    MAX_ITEMS: "giftBoxBuilder.validation.maxItems",
    CAPACITY_EXCEEDED: "giftBoxBuilder.validation.capacity",
    PRODUCT_INELIGIBLE: "giftBoxBuilder.validation.productUnavailable",
    INSUFFICIENT_STOCK: "giftBoxBuilder.validation.stock",
    MESSAGE_TOO_LONG: "giftBoxBuilder.validation.messageTooLong",
    PACKAGING_UNAVAILABLE: "giftBoxBuilder.validation.packagingUnavailable",
  };
  const vars = Object.fromEntries(
    Object.entries(error.meta).map(([key, value]) => [key, String(value)]),
  );
  return translate(locale, keys[error.code], vars);
}

export async function addCustomGiftBoxAction(
  rawInput: unknown,
): Promise<ActionResult<GiftBoxCartLine>> {
  const meta = await publicRequestMeta();
  const locale = extractLocale(rawInput);
  try {
    const rate = await checkRateLimit(`gift-box:${meta.ipAddress}`, RATE_LIMIT);
    if (!rate.allowed)
      return failure(
        "RATE_LIMITED",
        translate(locale, "giftBoxBuilder.validation.generic"),
      );
    const parsed = giftBoxConfigurationSchema.safeParse(rawInput);
    if (!parsed.success)
      return failure(
        "VALIDATION_ERROR",
        translate(locale, "giftBoxBuilder.validation.generic"),
        localizeFieldErrors(parsed.error, locale),
      );

    const session = await getSession();
    const line = await createGiftBoxConfiguration(
      parsed.data,
      session?.user.id,
    );
    logger.info("gift_box_configured", {
      correlationId: meta.correlationId,
      configurationId: line.configurationId,
      totalCents: line.totalCents,
    });
    return { success: true, data: line };
  } catch (error) {
    if (error instanceof GiftBoxValidationError)
      return failure(error.code, validationMessage(locale, error));
    if (error instanceof CommerceError)
      return failure(
        error.code,
        translate(locale, "giftBoxBuilder.validation.generic"),
      );
    logger.error("gift_box_configuration_failed", {
      correlationId: meta.correlationId,
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return failure(
      "GIFT_BOX_FAILED",
      translate(locale, "giftBoxBuilder.validation.generic"),
    );
  }
}

const fixedBoxSchema = z.object({
  locale: localeSchema,
  slug: z.string().min(1).max(200),
  giftMessage: z.string().trim().max(240).optional(),
  occasion: z.enum(giftOccasionValues).optional(),
});

export async function addFixedGiftBoxAction(
  rawInput: unknown,
): Promise<ActionResult<GiftBoxCartLine>> {
  const meta = await publicRequestMeta();
  const locale = extractLocale(rawInput);
  try {
    const rate = await checkRateLimit(`gift-box:${meta.ipAddress}`, RATE_LIMIT);
    if (!rate.allowed)
      return failure(
        "RATE_LIMITED",
        translate(locale, "giftBoxBuilder.validation.generic"),
      );
    const parsed = fixedBoxSchema.safeParse(rawInput);
    if (!parsed.success)
      return failure(
        "VALIDATION_ERROR",
        translate(locale, "giftBoxBuilder.validation.generic"),
        localizeFieldErrors(parsed.error, locale),
      );
    const line = await createFixedGiftBoxConfiguration(parsed.data);
    logger.info("gift_box_fixed_added", {
      correlationId: meta.correlationId,
      configurationId: line.configurationId,
    });
    return { success: true, data: line };
  } catch (error) {
    if (error instanceof GiftBoxValidationError)
      return failure(error.code, validationMessage(locale, error));
    if (error instanceof CommerceError)
      return failure(
        error.code,
        translate(locale, "giftBoxBuilder.validation.generic"),
      );
    logger.error("gift_box_fixed_failed", {
      correlationId: meta.correlationId,
      errorType: error instanceof Error ? error.name : "unknown",
    });
    return failure(
      "GIFT_BOX_FAILED",
      translate(locale, "giftBoxBuilder.validation.generic"),
    );
  }
}

function extractLocale(rawInput: unknown): AppLocale {
  if (
    typeof rawInput === "object" &&
    rawInput !== null &&
    "locale" in rawInput &&
    (rawInput.locale === "de" || rawInput.locale === "en")
  )
    return rawInput.locale;
  return "de";
}

function failure(
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { success: false, error: { code, message, fieldErrors } };
}
