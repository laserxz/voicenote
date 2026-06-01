import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { structureNote } from "@/lib/structure";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  if (body.action === "restructure") {
    const structured = await structureNote(note.transcript);
    const updated = await prisma.note.update({
      where: { id },
      data: {
        title: structured.title,
        structured: structured.content as object,
        noteType: structured.type,
      },
    });
    return NextResponse.json({ note: updated, structured });
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.transcript !== undefined) {
    data.transcript = body.transcript;
  }

  const updated = await prisma.note.update({ where: { id }, data });
  return NextResponse.json({ note: updated });
}
