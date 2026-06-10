"use client";
import { useState, useEffect, useCallback } from "react";
import { NoteCard } from "@/components/NoteCard";
import Link from "next/link";

const NOTE_TYPES = [
  "LIST", "BRAINSTORM", "POSTMORTEM", "MEETING",
  "ACTION_ITEMS", "JOURNAL", "PROBLEM", "RAW",
];

interface NoteItem {
  id: string;
  title: string | null;
  noteType: string;
  createdAt: string;
  duration: number | null;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotes = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type) params.set("type", type);
      params.set("page", String(pageNum));
      const res = await fetch(`/api/notes/search?${params}`);
      const data = await res.json();
      setNotes((prev) =>
        append ? [...prev, ...(data.notes ?? [])] : (data.notes ?? [])
      );
      setTotal(data.total ?? 0);
      setLoading(false);
      setLoadingMore(false);
    },
    [q, type]
  );

  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => fetchNotes(1, false), 300);
    return () => clearTimeout(t);
  }, [fetchNotes]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchNotes(next, true);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
        <Link href="/" className="text-zinc-400 hover:text-white text-sm">
          ← Record
        </Link>
        <h1 className="font-semibold text-white">Notes</h1>
        <span className="text-zinc-500 text-sm">{total}</span>
      </header>

      {/* Search */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        <input
          type="search"
          placeholder="Search notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 text-sm"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setType("")}
            className={`shrink-0 text-xs px-3 py-1 rounded-full transition-colors ${
              type === "" ? "bg-white text-zinc-950 font-medium" : "bg-zinc-900 text-zinc-400"
            }`}
          >
            All
          </button>
          {NOTE_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t === type ? "" : t)}
              className={`shrink-0 text-xs px-3 py-1 rounded-full transition-colors ${
                type === t ? "bg-white text-zinc-950 font-medium" : "bg-zinc-900 text-zinc-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-2 space-y-2">
        {loading ? (
          <p className="text-zinc-600 text-sm text-center py-8">Loading…</p>
        ) : notes.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-8">No notes found.</p>
        ) : (
          <>
            {notes.map((note) => (
              <NoteCard key={note.id} {...note} />
            ))}
            {notes.length < total && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full py-3 text-sm text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50"
              >
                {loadingMore
                  ? "Loading…"
                  : `Load more (${notes.length} of ${total})`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
