import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  // API routes are excluded — they return their own 401s instead of a
  // redirect to the login page. Manifest and icons must be public for PWA.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login|manifest.webmanifest|icons).*)",
  ],
};
