import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import type { AdminArea } from "@/config/admin";
import { adminAreas, canAccessAdmin } from "@/config/admin";
import { resolveLocalizedPathname } from "@/config/routes";
import { routing } from "@/i18n/navigation";
import { auth } from "@/lib/auth/auth";

const localeMiddleware = createMiddleware(routing);

function continueAdmin(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-next-intl-locale", "en");
  return NextResponse.next({ request: { headers: requestHeaders } });
}

function adminArea(pathname: string): AdminArea {
  const segment = pathname.split("/").filter(Boolean)[1];
  return adminAreas.includes(segment as AdminArea)
    ? (segment as AdminArea)
    : "dashboard";
}

function accessResponse(status: 401 | 403) {
  const unauthorized = status === 401;
  const heading = unauthorized ? "Sign in required" : "Access not permitted";
  const message = unauthorized
    ? "Please sign in with an authorised staff account to continue."
    : "Your account does not have permission to open this administration area.";
  const href = unauthorized ? "/de/sign-in?callbackURL=/admin" : "/de";
  const link = unauthorized ? "Sign in" : "Return to storefront";

  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${status} · Khan Dry Fruit</title><style>body{margin:0;font-family:system-ui,sans-serif;background:#f7f4ed;color:#28251f}.access{min-height:100vh;display:grid;place-content:center;text-align:center;padding:2rem}.code{color:#75643d;font-weight:700;letter-spacing:.12em}.button{display:inline-block;margin-top:1rem;padding:.75rem 1rem;border-radius:.5rem;background:#315b3b;color:white;text-decoration:none}</style></head><body><main class="access"><p class="code">${status}</p><h1>${heading}</h1><p>${message}</p><p><a class="button" href="${href}">${link}</a></p></main></body></html>`,
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}

export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Proxy provides the full-document access state. RSC navigations and
    // mutations continue to the layout/page/action checks so Next can return
    // its native protocol response instead of HTML.
    if (request.method !== "GET" || request.headers.get("rsc") === "1")
      return continueAdmin(request);
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return accessResponse(401);
    if (
      !canAccessAdmin(
        String(session.user.role),
        adminArea(request.nextUrl.pathname),
      )
    )
      return accessResponse(403);
    return continueAdmin(request);
  }

  const localized = resolveLocalizedPathname(request.nextUrl.pathname);
  if (localized) {
    const url = request.nextUrl.clone();
    url.pathname = localized.path;
    if (localized.action === "redirect")
      return NextResponse.redirect(url, 308);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "x-next-intl-locale",
      localized.path.split("/").filter(Boolean)[0] ?? "de",
    );
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  return localeMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
