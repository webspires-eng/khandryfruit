import "server-only";

import { isIP } from "node:net";

export function trustedClientIp(headers: Headers) {
  const platformTrusted =
    process.env.VERCEL === "1" || headers.has("x-vercel-id");
  if (process.env.NODE_ENV === "production" && !platformTrusted)
    return "unknown";
  const candidate =
    headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip")?.trim();
  return candidate && isIP(candidate) ? candidate : "unknown";
}
