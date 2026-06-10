import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit("reset-password", ip, 5, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
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

    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    if (!user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiresAt: null },
      });
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
    });

    return NextResponse.json({
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (err) {
    console.error("[reset-password] failed:", err);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
