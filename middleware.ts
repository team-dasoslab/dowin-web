import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "wig_sid";
const LOGIN_ROUTE = "/";
const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard/my";

const PUBLIC_PATHS = new Set([LOGIN_ROUTE]);

const isPublicPath = (pathname: string) => {
  return PUBLIC_PATHS.has(pathname);
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (hasSessionCookie && isPublicPath(pathname)) {
    return NextResponse.redirect(
      new URL(DEFAULT_AUTHENTICATED_ROUTE, request.url),
    );
  }

  if (!hasSessionCookie && !isPublicPath(pathname)) {
    const loginUrl = new URL(LOGIN_ROUTE, request.url);
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|workbox-.*|.*\\..*).*)",
  ],
};
