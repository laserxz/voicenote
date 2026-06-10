import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NoteType } from "@/generated/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;

  const where = {
    userId: session.user.id,
    ...(type && Object.values(NoteType).includes(type as NoteType)
      ? { noteType: type as NoteType }
      : {}),
    ...(q
      ? {
          OR: [
            { transcript: { contains: q, mode: "insensitive" as const } },
            { title: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        noteType: true,
        createdAt: true,
        duration: true,
      },
    }),
    prisma.note.count({ where }),
  ]);

  return NextResponse.json({
    notes,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
