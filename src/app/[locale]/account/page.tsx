import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { localizedPath } from "@/config/routes";
import { isLocale, type AppLocale } from "@/config/site";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/server/policies/authorization";
import { MfaSecurityCard } from "@/features/auth/mfa-security-card";
export const metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

async function latestWholesaleApplication(userId: string) {
  if (!env.DATABASE_URL) return null;
  try {
    return await db.wholesaleApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { status: true, companyName: true, createdAt: true },
    });
  } catch {
    return null;
  }
}

const statusBadgeClass: Record<string, string> = {
  APPROVED: "wholesale-status-badge status-approved",
  REJECTED: "wholesale-status-badge status-rejected",
  MORE_INFORMATION_REQUIRED: "wholesale-status-badge status-info",
};

function WholesaleStatusCard({
  locale,
  application,
  t,
}: {
  locale: AppLocale;
  application: Awaited<ReturnType<typeof latestWholesaleApplication>>;
  t: Awaited<ReturnType<typeof getTranslations<"wholesaleStatus">>>;
}) {
  return (
    <section className="account-card" data-testid="wholesale-status-card">
      <h2>{t("cardTitle")}</h2>
      {application ? (
        <>
          <p>
            {application.companyName} ·{" "}
            {t("appliedOn", {
              date: application.createdAt.toLocaleDateString(
                locale === "de" ? "de-DE" : "en-GB",
              ),
            })}
          </p>
          <span
            className={
              statusBadgeClass[application.status] ?? "wholesale-status-badge"
            }
          >
            {t(
              application.status as
                | "SUBMITTED"
                | "UNDER_REVIEW"
                | "MORE_INFORMATION_REQUIRED"
                | "APPROVED"
                | "REJECTED",
            )}
          </span>
          {application.status === "MORE_INFORMATION_REQUIRED" && (
            <p className="muted">{t("moreInfoNote")}</p>
          )}
        </>
      ) : (
        <>
          <p>{t("none")}</p>
          <Link
            className="text-link"
            href={localizedPath("wholesale", locale)}
            locale={locale}
          >
            {t("apply")} →
          </Link>
        </>
      )}
    </section>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const session = await requireUser(locale);
  const [tWholesale, application] = await Promise.all([
    getTranslations("wholesaleStatus"),
    latestWholesaleApplication(session.user.id),
  ]);
  const de = locale === "de";
  return (
    <div className="page-shell container">
      <header className="page-hero">
        <p className="eyebrow">{de ? "Kundenkonto" : "Customer account"}</p>
        <h1>
          {de ? `Hallo, ${session.user.name}` : `Hello, ${session.user.name}`}
        </h1>
        <p>{session.user.email}</p>
      </header>
      <div className="account-grid">
        <MfaSecurityCard
          locale={locale}
          enabled={Boolean(session.user.twoFactorEnabled)}
        />
        {[
          [
            de ? "Bestellungen" : "Orders",
            de
              ? "Bestellverlauf und Status ansehen"
              : "View order history and status",
          ],
          [
            de ? "Adressen" : "Addresses",
            de
              ? "Liefer- und Rechnungsadressen verwalten"
              : "Manage shipping and billing addresses",
          ],
          [
            de ? "Profil & Sicherheit" : "Profile & security",
            de
              ? "Kontodaten und Passwort verwalten"
              : "Manage profile and password",
          ],
          [
            de ? "Datenschutz" : "Privacy",
            de
              ? "Datenexport oder Löschung anfragen"
              : "Request export or deletion",
          ],
        ].map(([title, body]) => (
          <section className="account-card" key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
            <button className="text-link">{de ? "Öffnen" : "Open"} →</button>
          </section>
        ))}
        <WholesaleStatusCard
          locale={locale}
          application={application}
          t={tWholesale}
        />
      </div>
    </div>
  );
}
