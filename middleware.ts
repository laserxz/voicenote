import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Does NOT import @/lib/auth: that now pulls in Prisma, which can't run on
// the Edge runtime. Reads the session JWT directly instead (memoir pattern).
export async function middleware(req: NextRequest) {
  // Auth.js v5 uses the "authjs" cookie prefix ("__Secure-" on HTTPS), but
  // getToken defaults to the old "next-auth" prefix.
  const isSecure = req.nextUrl.protocol === "https:";
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // API routes are excluded — they return their own 401s instead of a
  // redirect. Auth pages, manifest and icons must be public.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|signup|forgot-password|reset-password|manifest.webmanifest|icons).*)",
  ],
};
