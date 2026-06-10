import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit("forgot-password", ip, 3, 15 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many reset attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiresAt },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
      await sendPasswordResetEmail(user.email, resetUrl);
    }

    // Always succeed to avoid email enumeration
    return NextResponse.json({
      message: "If that email has an account, a reset link is on its way.",
    });
  } catch (err) {
    console.error("[forgot-password] failed:", err);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
