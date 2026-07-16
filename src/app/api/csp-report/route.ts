import { logger } from "@/lib/logging/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { trustedClientIp } from "@/lib/security/client-ip";

const MAX_REPORT_BYTES = 16_384;

export async function POST(request: Request) {
  const size = Number(request.headers.get("content-length") ?? "0");
  if (size > MAX_REPORT_BYTES) return new Response(null, { status: 413 });
  const rate = await checkRateLimit(
    `csp-report:${trustedClientIp(request.headers)}`,
    { limit: 30, windowMs: 60_000 },
  );
  if (!rate.allowed)
    return new Response(null, {
      status: 429,
      headers: { "Retry-After": String(rate.retryAfterSeconds) },
    });
  try {
    const text = await request.text();
    if (text.length > MAX_REPORT_BYTES)
      return new Response(null, { status: 413 });
    const payload = JSON.parse(text) as Record<string, unknown>;
    const report = (payload["csp-report"] ?? payload) as Record<
      string,
      unknown
    >;
    logger.warn("csp_violation", {
      directive:
        typeof report["effective-directive"] === "string"
          ? report["effective-directive"]
          : "unknown",
      disposition:
        typeof report.disposition === "string" ? report.disposition : "unknown",
    });
  } catch {
    return new Response(null, { status: 400 });
  }
  return new Response(null, { status: 204 });
}
