"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  noteId: string;
  title: string;
  transcript: string;
}

export function NoteActions({ noteId, title, transcript }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editTranscript, setEditTranscript] = useState(transcript);
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading("delete");
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    router.push("/notes");
  };

  const handleSave = async () => {
    setLoading("save");
    await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, transcript: editTranscript }),
    });
    setEditing(false);
    setLoading(null);
    router.refresh();
  };

  const handleRestructure = async () => {
    setLoading("restructure");
    await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restructure" }),
    });
    setLoading(null);
    router.refresh();
  };

  if (editing) {
    return (
      <div className="space-y-3 bg-zinc-900 rounded-xl p-4">
        <div>
          <label className="text-zinc-400 text-xs block mb-1">Title</label>
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label className="text-zinc-400 text-xs block mb-1">Transcript</label>
          <textarea
            value={editTranscript}
            onChange={(e) => setEditTranscript(e.target.value)}
            rows={6}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-zinc-500 resize-y"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading === "save"}
            className="px-4 py-2 bg-white text-zinc-950 text-sm font-medium rounded-lg hover:bg-zinc-100 disabled:opacity-50"
          >
            {loading === "save" ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setEditTitle(title);
              setEditTranscript(transcript);
            }}
            className="px-4 py-2 text-zinc-400 text-sm hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 border-t border-zinc-900 pt-4">
      <button
        onClick={() => setEditing(true)}
        className="px-4 py-2 bg-zinc-900 text-zinc-300 text-sm rounded-lg hover:bg-zinc-800 transition-colors"
      >
        Edit
      </button>
      <button
        onClick={handleRestructure}
        disabled={loading === "restructure"}
        className="px-4 py-2 bg-zinc-900 text-zinc-300 text-sm rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
      >
        {loading === "restructure" ? "Re-structuring…" : "Re-structure"}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading === "delete"}
        className={`px-4 py-2 text-sm rounded-lg transition-colors ml-auto ${
          confirming
            ? "bg-red-600 text-white hover:bg-red-500"
            : "bg-zinc-900 text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
        } disabled:opacity-50`}
      >
        {loading === "delete"
          ? "Deleting…"
          : confirming
            ? "Confirm delete"
            : "Delete"}
      </button>
      {confirming && !loading && (
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-2 text-zinc-500 text-sm hover:text-white"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
