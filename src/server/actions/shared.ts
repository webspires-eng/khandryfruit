import "server-only";

import { headers } from "next/headers";

/** Request metadata for audit logging and abuse limiting. */
export async function publicRequestMeta() {
  const requestHeaders = await headers();
  return {
    ipAddress:
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    correlationId: requestHeaders.get("x-vercel-id") ?? crypto.randomUUID(),
  };
}
