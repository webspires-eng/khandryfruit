/**
 * URL validation that rejects executable and inline-content schemes.
 *
 * `z.string().url()` only checks that the value parses as a URL, so it accepts
 * `javascript:`, `data:` and `vbscript:`. Any such value later rendered into an
 * `href` executes on click, and React does not sanitise `href` attributes.
 *
 * Every externally supplied URL that will be rendered as a link or placed in an
 * email must pass through here.
 */
const SAFE_PROTOCOLS = new Set(["https:", "http:"]);

export function parseSafeUrl(
  value: string | null | undefined,
  options: { allowHttp?: boolean } = {},
): URL | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (!SAFE_PROTOCOLS.has(url.protocol)) return null;
  // Plain http is tolerable on a developer machine but never in production,
  // where it would downgrade a customer from a secure page.
  const allowHttp = options.allowHttp ?? process.env.NODE_ENV !== "production";
  if (url.protocol === "http:" && !allowHttp) return null;
  return url;
}

export function isSafeUrl(
  value: string | null | undefined,
  options?: { allowHttp?: boolean },
) {
  return parseSafeUrl(value, options) !== null;
}

/** Returns the URL when safe, otherwise undefined — for use in `href`. */
export function safeHref(value: string | null | undefined): string | undefined {
  return parseSafeUrl(value)?.href;
}
