import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // If accessing /admin/login, redirect to /login
    if (pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const adminAuthCookie = request.cookies.get("massimo-admin-auth");

    // If no admin auth cookie is present or is empty/invalid length, block access and redirect to /login
    if (!adminAuthCookie?.value || adminAuthCookie.value.trim().length !== 24) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
