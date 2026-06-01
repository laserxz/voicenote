import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NoteRenderer } from "@/components/NoteRenderer";
import { NoteActions } from "@/components/NoteActions";
import Link from "next/link";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note) notFound();

  const fmt = new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
        <Link href="/notes" className="text-zinc-400 hover:text-white text-sm">
          ← Notes
        </Link>
        <span className="text-xs text-zinc-500">{note.noteType}</span>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {note.title || "Untitled"}
          </h1>
          <p className="text-zinc-500 text-xs mt-1">
            {fmt.format(note.createdAt)}
            {note.duration != null && (
              <span>
                {" · "}
                {Math.floor(note.duration / 60)}:
                {String(note.duration % 60).padStart(2, "0")}
              </span>
            )}
            {note.emailedAt && (
              <span className="text-zinc-600"> · emailed</span>
            )}
          </p>
        </div>

        {/* Structured content */}
        <div>
          <NoteRenderer
            noteType={note.noteType}
            content={note.structured as Record<string, unknown>}
          />
        </div>

        {/* Raw transcript toggle */}
        <details className="group">
          <summary className="text-zinc-500 text-xs cursor-pointer hover:text-zinc-300 select-none">
            Raw transcript
          </summary>
          <p className="mt-3 text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
            {note.transcript}
          </p>
        </details>

        <NoteActions
          noteId={note.id}
          title={note.title || ""}
          transcript={note.transcript}
        />
      </main>
    </div>
  );
}
