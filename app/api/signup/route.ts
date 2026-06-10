import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  isValidEmail,
  sanitizeString,
  checkRateLimit,
  getClientIp,
} from "@/lib/validation";

export async function POST(req: NextRequest) {
  // 5 signups per IP per hour
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit("signup", ip, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { email, password, displayName } = await req.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    ) {
      return NextResponse.json(
        { error: "Password must be between 8 and 128 characters" },
        { status: 400 }
      );
    }

    const cleanName = sanitizeString(displayName, 200);
    if (!cleanName) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      // Generic error to avoid email enumeration
      return NextResponse.json(
        { error: "Unable to create account. Please try a different email." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash, displayName: cleanName },
    });

    return NextResponse.json(
      { id: user.id, email: user.email },
      { status: 201 }
    );
  } catch (err) {
    console.error("[signup] failed:", err);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
