import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { verifySessionToken } from "@/lib/session";

const protectedPrefixes = [
  "/dashboard",
  "/mentors",
  "/sessions",
  "/repository",
  "/profile",
  "/call",
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  return handleRequest(request, pathname, sessionToken);
}

async function handleRequest(
  request: NextRequest,
  pathname: string,
  sessionToken?: string,
) {
  const isLoggedIn = await verifySessionToken(sessionToken);

  if (pathname === "/") {
    const response = NextResponse.redirect(
      new URL(isLoggedIn ? "/dashboard" : "/auth", request.url),
    );

    if (sessionToken && !isLoggedIn) {
      response.cookies.set(AUTH_COOKIE_NAME, "", {
        path: "/",
        maxAge: 0,
      });
    }

    return response;
  }

  if (pathname === "/auth" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtectedPath(pathname) && !isLoggedIn) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(authUrl);

    if (sessionToken) {
      response.cookies.set(AUTH_COOKIE_NAME, "", {
        path: "/",
        maxAge: 0,
      });
    }

    return response;
  }

  const response = NextResponse.next();

  if (pathname === "/auth" && sessionToken && !isLoggedIn) {
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/auth",
    "/dashboard/:path*",
    "/mentors/:path*",
    "/sessions/:path*",
    "/repository/:path*",
    "/profile/:path*",
    "/call/:path*",
  ],
};
