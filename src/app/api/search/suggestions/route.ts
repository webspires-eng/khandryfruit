import { NextResponse } from "next/server";
import { isLocale, type AppLocale } from "@/config/site";
import { suggestProducts } from "@/server/services/search";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET(request: Request) {
  try {
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
