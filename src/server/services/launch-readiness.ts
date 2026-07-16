import "server-only";

import { productionEnvironmentIssues } from "@/lib/env";
import { db } from "@/lib/db/client";
import { getProductReadiness } from "@/server/services/product-readiness";

export type LaunchCheck = {
  key: string;
  label: string;
  ready: boolean;
  detail: string;
  severity: "CRITICAL" | "COMMERCE_BLOCKER" | "WARNING" | "OPTIONAL";
};

const settingText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export async function getLaunchReadiness() {
  const [settings, legal, content, shippingRates, products] = await Promise.all(
    [
      db.siteSetting.findMany(),
      db.legalDocument.findMany(),
      db.contentPage.findMany({
        where: { key: { in: ["returns", "shipping"] } },
        select: { key: true, complete: true, status: true },
      }),
      db.shippingRate.count({ where: { method: { active: true } } }),
      db.product.findMany({
        where: { deletedAt: null },
        select: { id: true, status: true },
      }),
    ],
  );
  const values = new Map(
    settings.map((item) => [item.key, settingText(item.value)]),
  );
  const legalComplete = (key: string) =>
    ["de", "en"].every((locale) =>
      legal.some(
        (item) => item.key === key && item.locale === locale && item.complete,
      ),
    );
  const contentComplete = (key: string) =>
    content.some(
      (item) =>
        item.key === key && item.complete && item.status === "PUBLISHED",
    );
  const readiness = await Promise.all(
    products.map(({ id }) => getProductReadiness(id)),
  );
  const readyProductIds = new Set(
    readiness.filter((item) => item?.ready).map((item) => item!.product.id),
  );
  const activeProducts = products.filter((item) => item.status === "ACTIVE");
  const environmentIssues = productionEnvironmentIssues();
  const checks: LaunchCheck[] = [
    {
      key: "environment",
      label: "Production environment",
      ready: environmentIssues.length === 0,
      detail: environmentIssues.length
        ? `${environmentIssues.length} variables missing or unsafe`
        : "All required variables are launch-safe",
      severity: "CRITICAL",
    },
    {
      key: "business-address",
      label: "Business address",
      ready: Boolean(values.get("business.address")),
      detail: "Confirmed legal business address",
      severity: "CRITICAL",
    },
    {
      key: "business-email",
      label: "Public business email",
      ready: Boolean(values.get("business.email")),
      detail: "Customer-visible business email",
      severity: "COMMERCE_BLOCKER",
    },
    {
      key: "vat-mode",
      label: "VAT mode",
      ready:
        Boolean(values.get("commerce.vatMode")) &&
        values.get("commerce.vatMode") !== "UNCONFIRMED",
      detail: "Must be confirmed by the business/tax adviser",
      severity: "COMMERCE_BLOCKER",
    },
    {
      key: "impressum",
      label: "Impressum",
      ready: legalComplete("impressum"),
      detail: "Approved German and English records",
      severity: "CRITICAL",
    },
    {
      key: "privacy",
      label: "Privacy policy",
      ready: legalComplete("privacy"),
      detail: "Approved German and English records",
      severity: "CRITICAL",
    },
    {
      key: "terms",
      label: "Terms",
      ready: legalComplete("terms"),
      detail: "Approved German and English records",
      severity: "COMMERCE_BLOCKER",
    },
    {
      key: "withdrawal",
      label: "Withdrawal policy",
      ready: legalComplete("withdrawal"),
      detail: "Approved German and English records",
      severity: "COMMERCE_BLOCKER",
    },
    {
      key: "returns",
      label: "Return policy",
      ready: contentComplete("returns"),
      detail: "Complete and published content page",
      severity: "COMMERCE_BLOCKER",
    },
    {
      key: "shipping-content",
      label: "Shipping policy",
      ready: contentComplete("shipping"),
      detail: "Complete and published content page",
      severity: "COMMERCE_BLOCKER",
    },
    {
      key: "shipping-rates",
      label: "Shipping rates",
      ready: shippingRates > 0,
      detail: `${shippingRates} active rates`,
      severity: "COMMERCE_BLOCKER",
    },
    {
      key: "lucid",
      label: "LUCID status",
      ready: Boolean(values.get("business.lucidNumber")),
      detail: "Registration must be confirmed by the business",
      severity: "COMMERCE_BLOCKER",
    },
    {
      key: "food-registration",
      label: "Food-business registration",
      ready: Boolean(values.get("business.foodBusinessRegistration")),
      detail: "Registration status must be confirmed",
      severity: "COMMERCE_BLOCKER",
    },
    {
      key: "catalogue",
      label: "Published catalogue",
      ready:
        activeProducts.length > 0 &&
        activeProducts.every((item) => readyProductIds.has(item.id)),
      detail: `${activeProducts.length} active products; ${readyProductIds.size} products publication-ready`,
      severity: "COMMERCE_BLOCKER",
    },
  ];
  const blockingChecks = checks.filter(
    (check) =>
      !check.ready &&
      (check.severity === "CRITICAL" || check.severity === "COMMERCE_BLOCKER"),
  );
  return {
    ready: blockingChecks.length === 0,
    deploymentReady: checks.every(
      (check) => check.ready || check.severity !== "CRITICAL",
    ),
    commerceReady: blockingChecks.length === 0,
    checks,
    blockerCount: blockingChecks.length,
    warningCount: checks.filter(
      (check) => !check.ready && check.severity === "WARNING",
    ).length,
  };
}
