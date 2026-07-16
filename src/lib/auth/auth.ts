import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor, username } from "better-auth/plugins";

import { db } from "@/lib/db/client";
import { getEmailProvider } from "@/lib/email/provider";
import { env } from "@/lib/env";
import { logger } from "@/lib/logging/logger";

const vercelOrigin = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

export const auth = betterAuth({
  appName: "Khan Dry Fruit",
  baseURL: env.BETTER_AUTH_URL || env.NEXT_PUBLIC_SITE_URL,
  trustedOrigins: [
    env.NEXT_PUBLIC_SITE_URL,
    env.BETTER_AUTH_URL,
    vercelOrigin,
  ].filter((origin): origin is string => Boolean(origin)),
  secret:
    env.BETTER_AUTH_SECRET ??
    "development-only-secret-change-before-production",
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: env.NODE_ENV === "production",
    minPasswordLength: 12,
    sendResetPassword: async ({ user, url }) => {
      const german = "locale" in user && user.locale === "de";
      await getEmailProvider().send({
        to: user.email,
        locale: german ? "de" : "en",
        subject: german
          ? "Passwort zurücksetzen – Khan Dry Fruit"
          : "Reset your password – Khan Dry Fruit",
        text: german
          ? `Setzen Sie Ihr Passwort über diesen Link zurück: ${url}`
          : `Reset your password using this link: ${url}`,
        html: `<p>${german ? "Setzen Sie Ihr Passwort über den sicheren Link zurück:" : "Reset your password using the secure link:"}</p><p><a href="${url}">${german ? "Passwort zurücksetzen" : "Reset password"}</a></p>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const german = "locale" in user && user.locale === "de";
      await getEmailProvider().send({
        to: user.email,
        locale: german ? "de" : "en",
        subject: german
          ? "E-Mail bestätigen – Khan Dry Fruit"
          : "Verify your email – Khan Dry Fruit",
        text: german
          ? `Bestätigen Sie Ihre E-Mail-Adresse: ${url}`
          : `Verify your email address: ${url}`,
        html: `<p>${german ? "Bestätigen Sie Ihre E-Mail-Adresse:" : "Verify your email address:"}</p><p><a href="${url}">${german ? "E-Mail bestätigen" : "Verify email"}</a></p>`,
      });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "CUSTOMER",
        input: false,
      },
      locale: { type: "string", required: false, defaultValue: "de" },
      disabled: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60,
    freshAge: 60 * 15,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
    crossSubDomainCookies: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
  },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 30 }),
    twoFactor({
      issuer: "Khan Dry Fruit",
      twoFactorCookieMaxAge: 60 * 10,
      trustDeviceMaxAge: 60 * 60 * 24 * 7,
      backupCodeOptions: {
        amount: 10,
        length: 12,
        storeBackupCodes: "encrypted",
      },
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 5,
        durationSeconds: 15 * 60,
      },
    }),
  ],
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { id: true, email: true, role: true, locale: true },
          });
          if (
            !user ||
            ![
              "CONTENT_EDITOR",
              "ORDER_MANAGER",
              "ADMIN",
              "SUPER_ADMIN",
            ].includes(user.role)
          )
            return;
          await db.auditLog.create({
            data: {
              actorId: user.id,
              action: "PRIVILEGED_LOGIN",
              entityType: "Session",
              entityId: session.id,
              ipAddress: session.ipAddress,
              after: { role: user.role },
            },
          });
          try {
            const german = user.locale === "de";
            await getEmailProvider().send({
              to: user.email,
              locale: german ? "de" : "en",
              subject: german
                ? "Neue Administrator-Anmeldung"
                : "New administrator sign-in",
              text: german
                ? "Eine neue privilegierte Sitzung wurde für Ihr Konto erstellt. Widerrufen Sie unbekannte Sitzungen sofort."
                : "A new privileged session was created for your account. Revoke unknown sessions immediately.",
              html: german
                ? "<p>Eine neue privilegierte Sitzung wurde für Ihr Konto erstellt. Widerrufen Sie unbekannte Sitzungen sofort.</p>"
                : "<p>A new privileged session was created for your account. Revoke unknown sessions immediately.</p>",
            });
          } catch {
            logger.error("privileged_login_alert_failed", { userId: user.id });
          }
        },
      },
    },
  },
});
