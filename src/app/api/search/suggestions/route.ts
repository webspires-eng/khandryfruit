import { NextResponse } from "next/server";
import { isLocale, type AppLocale } from "@/config/site";
import { suggestProducts } from "@/server/services/search";
import { checkRateLimit } from "@/lib/rate-limit";
import { trustedClientIp } from "@/lib/security/client-ip";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(request: Request) {
  try {
    const rate = await checkRateLimit(
      `search:${trustedClientIp(request.headers)}`,
      { limit: 60, windowMs: 60_000 },
    );
    if (!rate.allowed)
      return NextResponse.json(
        { suggestions: [] },
        {
          status: 429,
          headers: {
            ...NO_STORE,
            "Retry-After": String(rate.retryAfterSeconds),
          },
        },
      );
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const localeParam = searchParams.get("locale") ?? "";
    const locale: AppLocale = isLocale(localeParam) ? localeParam : "de";
    if (q.length < 2) {
      return NextResponse.json({ suggestions: [] }, { headers: NO_STORE });
    }
    const suggestions = await suggestProducts(locale, q);
    return NextResponse.json({ suggestions }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ suggestions: [] }, { headers: NO_STORE });
  }
}
