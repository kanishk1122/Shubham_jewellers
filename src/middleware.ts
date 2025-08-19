import axios from "axios";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ...public paths allowed without authentication...
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/me",
  "/favicon.ico",
  "/robots.txt",
];

// Utility to check if path is public
const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

// NOTE: middleware runs in Edge runtime — avoid using Node-only modules (jwt.verify).
// Verify the token by delegating to the server-side endpoint /api/auth/me which runs in Node.
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

  // Verify token by calling server-side /api/auth/me (runs in Node, can verify JWT)
  try {
    const verifyUrl = new URL("/api/auth/me", req.url);
    const res = await axios.get(verifyUrl.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = res.data;

    // cosnole.log("middleware: token verification result:", json);

    if (!json.success) {
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
    // cosnole.log("middleware: token verification successful2:", json);

    const payload = json.data as any;

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
  } catch (err) {
    // cosnole.error("middleware: token verification failed", err);
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
}

// Apply middleware to all routes except Next internals (static handled above)
export const config = {
  matcher: ["/:path*"],
};
