import "server-only";

import { headers } from "next/headers";
import { trustedClientIp } from "@/lib/security/client-ip";

/** Request metadata for audit logging and abuse limiting. */
export async function publicRequestMeta() {
  const requestHeaders = await headers();
  return {
    ipAddress: trustedClientIp(requestHeaders),
    correlationId: requestHeaders.get("x-vercel-id") ?? crypto.randomUUID(),
  };
}
