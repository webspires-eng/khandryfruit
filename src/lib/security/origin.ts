const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizedOrigin(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function trustedOrigins(requestUrl?: string) {
  return new Set(
    [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.AUTH_URL,
      process.env.BETTER_AUTH_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      process.env.NODE_ENV !== "production"
        ? normalizedOrigin(requestUrl)
        : undefined,
    ]
      .map((value) => normalizedOrigin(value))
      .filter((value): value is string => Boolean(value)),
  );
}

export function hasTrustedOrigin(request: Request) {
  if (!unsafeMethods.has(request.method.toUpperCase())) return true;
  const origin = normalizedOrigin(request.headers.get("origin"));
  return Boolean(origin && trustedOrigins(request.url).has(origin));
}

export function rejectUntrustedOrigin(request: Request) {
  if (hasTrustedOrigin(request)) return null;
  return Response.json(
    {
      success: false,
      error: { code: "UNTRUSTED_ORIGIN", message: "Request rejected." },
    },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}
