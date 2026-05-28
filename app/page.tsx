"use client";
import { useState } from "react";
import { RecordButton } from "@/components/RecordButton";
import { NoteRenderer } from "@/components/NoteRenderer";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface NoteResult {
  note: { id: string; title: string | null; noteType: string; duration: number | null };
  structured: { type: string; title: string; content: Record<string, unknown> };
}

export default function RecorderPage() {
  const [result, setResult] = useState<NoteResult | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
        <h1 className="font-semibold text-white">VoiceNote</h1>
        <div className="flex items-center gap-4">
          <Link href="/notes" className="text-sm text-zinc-400 hover:text-white">
            Notes
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8">
        <RecordButton onComplete={(data) => setResult(data as NoteResult)} />

        {result && (
          <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-semibold">
                  {result.note.title || "Untitled"}
                </p>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {result.note.noteType}
                </p>
              </div>
              <Link
                href={`/notes/${result.note.id}`}
                className="text-xs text-zinc-400 hover:text-white shrink-0"
              >
                View →
              </Link>
            </div>
            <div className="text-sm">
              <NoteRenderer
                noteType={result.structured.type}
                content={result.structured.content}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
