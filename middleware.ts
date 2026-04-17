import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { detectLocale, isSupportedLocale } from "./src/i18n/detect-locale";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const SESSION_COOKIE = "wig_sid";
const LOGIN_ROUTE = "/";
const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard/my";

const PUBLIC_PATHS = new Set([LOGIN_ROUTE]);

const isPublicPath = (pathname: string) => {
  // strip locale prefix for check
  const segments = pathname.split("/");
  const pathWithoutLocale = "/" + segments.slice(2).join("/");

  // if segments[1] is a locale, check pathWithoutLocale
  if ((routing.locales as readonly string[]).includes(segments[1])) {
    return PUBLIC_PATHS.has(pathWithoutLocale);
  }

  return PUBLIC_PATHS.has(pathname);
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle locale routing
  const response = intlMiddleware(request);

  // 2. Handle auth
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  const nextLocaleCookie = request.cookies.get("NEXT_LOCALE")?.value;

  // Identify internal locale for redirects
  const segments = pathname.split("/");
  const locale = isSupportedLocale(segments[1])
    ? segments[1]
    : isSupportedLocale(nextLocaleCookie)
    ? nextLocaleCookie
    : detectLocale({
        customLocale: request.headers.get("x-wig-locale"),
        acceptLanguage: request.headers.get("accept-language"),
      });

  if (hasSessionCookie && isPublicPath(pathname)) {
    const target = new URL(
      `/${locale}${DEFAULT_AUTHENTICATED_ROUTE}`,
      request.url,
    );
    return NextResponse.redirect(target);
  }

  // Handle root path redirect for public users explicitly if intlMiddleware didn't
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  if (!hasSessionCookie && !isPublicPath(pathname)) {
    // skip if it's a static file or api
    const isFile = pathname.includes(".");
    const isApi = pathname.startsWith("/api");
    if (!isFile && !isApi) {
      const loginUrl = new URL(`/${locale}${LOGIN_ROUTE}`, request.url);
      loginUrl.searchParams.set(
        "next",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|workbox-.*|.*\\..*).*)",
  ],
};
