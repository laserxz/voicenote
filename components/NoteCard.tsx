import Link from "next/link";

const TYPE_COLORS: Record<string, string> = {
  LIST: "bg-blue-900 text-blue-200",
  BRAINSTORM: "bg-purple-900 text-purple-200",
  POSTMORTEM: "bg-red-900 text-red-200",
  MEETING: "bg-yellow-900 text-yellow-200",
  ACTION_ITEMS: "bg-orange-900 text-orange-200",
  JOURNAL: "bg-green-900 text-green-200",
  PROBLEM: "bg-pink-900 text-pink-200",
  RAW: "bg-zinc-800 text-zinc-400",
};

interface Props {
  id: string;
  title: string | null;
  noteType: string;
  createdAt: string | Date;
  duration: number | null;
}

export function NoteCard({ id, title, noteType, createdAt, duration }: Props) {
  const date = new Date(createdAt);
  const fmt = new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/notes/${id}`}
      className="block bg-zinc-900 rounded-xl px-4 py-3 hover:bg-zinc-800 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white font-medium truncate">
            {title || "Untitled"}
          </p>
          <p className="text-zinc-500 text-xs mt-0.5">{fmt.format(date)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[noteType] ?? TYPE_COLORS.RAW}`}
          >
            {noteType}
          </span>
          {duration != null && (
            <span className="text-zinc-600 text-xs">
              {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
