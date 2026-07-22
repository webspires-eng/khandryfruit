import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins";

import { PrismaClient } from "../src/generated/prisma/client";

/**
 * Create (or promote) an administrator account against the configured database.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts <email> <password> [role]
 *   ADMIN_NEW_EMAIL=... ADMIN_NEW_PASSWORD=... npx tsx scripts/create-admin.ts
 *
 * Role defaults to ADMIN; pass SUPER_ADMIN for full access.
 * Password must be at least 12 characters (enforced by better-auth below).
 */

const MIN_PASSWORD_LENGTH = 12;
const ALLOWED_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
type AdminRole = (typeof ALLOWED_ROLES)[number];

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required. Set it in .env before running.");
}
if (/PROJECT_REF|SUPABASE_DATABASE_PASSWORD|REGION\./.test(connectionString)) {
  throw new Error(
    "DATABASE_URL still contains template placeholders. Fill in the real Supabase connection string in .env first.",
  );
}
if (process.env.NODE_ENV === "production") {
  throw new Error(
    "Refusing to run against a production NODE_ENV. Create privileged users through the approved production process.",
  );
}

const [, , emailArg, passwordArg, roleArg] = process.argv;
const email = (emailArg ?? process.env.ADMIN_NEW_EMAIL ?? "").trim();
const password = passwordArg ?? process.env.ADMIN_NEW_PASSWORD ?? "";
const role = ((roleArg ?? process.env.ADMIN_NEW_ROLE ?? "ADMIN")
  .toUpperCase() as AdminRole);

if (!email || !password) {
  throw new Error(
    "Usage: npx tsx scripts/create-admin.ts <email> <password> [ADMIN|SUPER_ADMIN]",
  );
}
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  throw new Error(`"${email}" is not a valid email address.`);
}
if (password.length < MIN_PASSWORD_LENGTH) {
  throw new Error(
    `Password must be at least ${MIN_PASSWORD_LENGTH} characters (better-auth policy).`,
  );
}
if (!ALLOWED_ROLES.includes(role)) {
  throw new Error(`Role must be one of: ${ALLOWED_ROLES.join(", ")}.`);
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const auth = betterAuth({
  secret:
    process.env.AUTH_SECRET ??
    process.env.BETTER_AUTH_SECRET ??
    "development-only-seed-secret-at-least-32-chars",
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, minPasswordLength: MIN_PASSWORD_LENGTH },
  plugins: [username({ minUsernameLength: 3, maxUsernameLength: 30 })],
});

async function main() {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.info(`User ${email} already exists — promoting to ${role}.`);
  } else {
    await auth.api.signUpEmail({
      body: { name: "Store Administrator", email, password },
    });
    console.info(`Created ${email}.`);
  }

  await db.user.update({
    where: { email },
    data: { role, emailVerified: true },
  });

  console.info(`Done. ${email} is now ${role} with a verified email.`);
  console.info(
    "Sign in at /sign-in. Production ADMIN/SUPER_ADMIN access additionally requires MFA enrolment.",
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
