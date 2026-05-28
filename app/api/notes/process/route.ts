import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadAudio, deleteAudio } from "@/lib/r2";
import { transcribeAudio } from "@/lib/deepgram";
import { structureNote } from "@/lib/structure";
import { prisma } from "@/lib/prisma";
import { emailNote } from "@/lib/email";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("audio") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No audio file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${randomUUID()}.webm`;

  try {
    // 1. Upload to R2
    await uploadAudio(key, buffer, file.type || "audio/webm");

    // 2. Transcribe
    const { transcript, duration } = await transcribeAudio(
      buffer,
      file.type || "audio/webm"
    );
    if (!transcript.trim()) {
      await deleteAudio(key).catch(() => {});
      return NextResponse.json(
        { error: "Could not transcribe audio — try again" },
        { status: 422 }
      );
    }

    // 3. Structure with Claude
    const structured = await structureNote(transcript);

    // 4. Delete from R2
    await deleteAudio(key);

    // 5. Save to DB
    const note = await prisma.note.create({
      data: {
        title: structured.title,
        transcript,
        structured: structured.content as object,
        noteType: structured.type,
        duration,
      },
    });

    // 6. Email (non-blocking — don't fail the request if email fails)
    emailNote(note.id, structured)
      .then(() =>
        prisma.note.update({
          where: { id: note.id },
          data: { emailedAt: new Date() },
        })
      )
      .catch((err) => console.error("[email] failed:", err));

    return NextResponse.json({ note, structured });
  } catch (err) {
    await deleteAudio(key).catch(() => {});
    console.error("[process] error:", err);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
