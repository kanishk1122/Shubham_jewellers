import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

// ...public paths allowed without authentication...
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/seed",
  "/api/auth/register", // optional - keep if you want registration open
  "/api/auth/me", // allow token check endpoint
  "/favicon.ico",
  "/robots.txt",
];

// Utility to check if path is public
const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow next internals and static files without auth
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".") // allow assets like .css/.png
  ) {
    return NextResponse.next();
  }

  // Allow public paths (login/seed/register/me etc.)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Extract token from Authorization header or cookie 'token'
  let token: string | undefined;
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const authMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (authMatch) token = authMatch[1];
  else token = req.cookies.get("token")?.value;

  // If no token found -> unauthorized
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Verify token and check role
  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Enforce admin-only access for protected areas
  if (payload.role !== "admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: admin only" },
        { status: 403 }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Authorized — let the request continue
  return NextResponse.next();
}

// Apply middleware to all routes except Next internals (static handled above)
export const config = {
  matcher: ["/:path*"],
};
