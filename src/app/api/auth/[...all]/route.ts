import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { rejectUntrustedOrigin } from "@/lib/security/origin";
import { db } from "@/lib/db/client";
import { env } from "@/lib/env";
import { trustedClientIp } from "@/lib/security/client-ip";

const handlers = toNextJsHandler(auth);
export const GET = handlers.GET;

export async function POST(request: Request) {
  const originRejection = rejectUntrustedOrigin(request);
  if (originRejection) return originRejection;
  if (
    process.env.NODE_ENV === "production" &&
    new URL(request.url).pathname.endsWith("/two-factor/disable")
  ) {
    const session = await auth.api.getSession({ headers: request.headers });
    const role = String(session?.user.role ?? "");
    if (role === "ADMIN" || role === "SUPER_ADMIN")
      return Response.json(
        {
          code: "PRIVILEGED_MFA_REQUIRED",
          message: "Privileged MFA cannot be disabled in production.",
        },
        { status: 403 },
      );
  }
  const rate = await checkRateLimit(
    `auth:${trustedClientIp(request.headers)}`,
    { limit: 20, windowMs: 60_000 },
  );
  if (!rate.allowed)
    return Response.json(
      { code: "RATE_LIMITED", message: "Too many authentication attempts." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  const response = await handlers.POST(request);
  if (
    !response.ok &&
    env.DATABASE_URL &&
    /\/(sign-in|two-factor\/verify)/.test(new URL(request.url).pathname)
  ) {
    await db.auditLog
      .create({
        data: {
          action: "AUTHENTICATION_FAILED",
          entityType: "Authentication",
          ipAddress: trustedClientIp(request.headers),
          correlationId:
            request.headers.get("x-vercel-id") ?? crypto.randomUUID(),
          after: {
            path: new URL(request.url).pathname.split("/").slice(-2).join("/"),
          },
        },
      })
      .catch(() => undefined);
  }
  return response;
}
