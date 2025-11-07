import axios from "axios";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ...public paths allowed without authentication...
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/me",
  "/favicon.ico",
  "/robots.txt",
  "/api/seed"
];

// Utility to check if path is public
const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

// NOTE: middleware runs in Edge runtime — use WebCrypto-friendly jwt verifier (jose).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow next internals and static files without auth
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".")
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

  // token may be URL-encoded in cookie; decode safely
  try {
    token = decodeURIComponent(token);
  } catch {
    // ignore decode errors, use raw
  }

  // Verify JWT using jose (Edge-compatible)
  try {
    const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
    const secretKey = new TextEncoder().encode(JWT_SECRET);

    const { payload } = await jwtVerify(token, secretKey);
    // payload should contain { id, role, iat, exp ... }
    const id = (payload as any).id;
    const role = (payload as any).role;

    if (!id) {
      throw new Error("Invalid token payload");
    }

    // Enforce admin-only access for protected areas
    if (role !== "admin") {
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
  } catch (err) {
    // verification failed
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized token invalid" },
        { status: 401 }
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
}

// Apply middleware to all routes except Next internals (static handled above)
export const config = {
  matcher: ["/:path*"],
};
