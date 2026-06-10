interface Props {
  noteType: string;
  content: Record<string, unknown>;
}

// New notes are normalized at write time, but notes saved before
// normalization existed may have any shape — never trust `content`.
function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(str).filter((s) => s.length > 0) : [];
}

function objArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v)
    ? v.filter(
        (o): o is Record<string, unknown> => o != null && typeof o === "object"
      )
    : [];
}

export function NoteRenderer({ noteType, content }: Props) {
  const summary = str(content.summary);
  return (
    <div className="space-y-5">
      {summary && (
        <p className="text-zinc-300 leading-relaxed border-l-2 border-zinc-700 pl-3">
          {summary}
        </p>
      )}
      <NoteBody noteType={noteType} content={content} />
    </div>
  );
}

function NoteBody({ noteType, content }: Props) {
  switch (noteType) {
    case "LIST":
      return (
        <ul className="space-y-2">
          {strArray(content.items).map((item, i) => (
            <li key={i} className="flex gap-2 text-zinc-200">
              <span className="text-zinc-500 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case "BRAINSTORM":
      return (
        <div className="space-y-4">
          {objArray(content.clusters).map((cl, i) => (
            <div key={i}>
              <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
                {str(cl.theme)}
              </h3>
              <ul className="space-y-1">
                {strArray(cl.ideas).map((idea, j) => (
                  <li key={j} className="text-zinc-200 pl-3">
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case "POSTMORTEM":
      return (
        <div className="space-y-4">
          {(
            ["what_happened", "root_cause", "impact", "prevention"] as const
          ).map((k) => (
            <div key={k}>
              <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-1">
                {k.replace(/_/g, " ")}
              </h3>
              <p className="text-zinc-200">{str(content[k])}</p>
            </div>
          ))}
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
              Actions
            </h3>
            <ul className="space-y-1">
              {strArray(content.actions).map((a, i) => (
                <li key={i} className="text-zinc-200 pl-3">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );

    case "MEETING": {
      const attendees = strArray(content.attendees);
      const decisions = strArray(content.decisions);
      const actionItems = objArray(content.action_items);
      return (
        <div className="space-y-4">
          {attendees.length > 0 && (
            <div>
              <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
                Attendees
              </h3>
              <p className="text-zinc-200">{attendees.join(", ")}</p>
            </div>
          )}
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
              Decisions
            </h3>
            <ul className="space-y-1">
              {decisions.map((d, i) => (
                <li key={i} className="text-zinc-200 pl-3">
                  {d}
                </li>
              ))}
            </ul>
          </div>
          {actionItems.length > 0 && (
            <div>
              <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
                Action Items
              </h3>
              <ul className="space-y-2">
                {actionItems.map((a, i) => (
                  <li key={i} className="text-zinc-200 pl-3">
                    <span className="font-medium">{str(a.task)}</span>
                    {str(a.owner) && (
                      <span className="text-zinc-400"> — {str(a.owner)}</span>
                    )}
                    {str(a.due) && (
                      <span className="text-zinc-500"> by {str(a.due)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    case "ACTION_ITEMS": {
      const PRIORITY_COLORS = {
        high: "text-red-400",
        medium: "text-yellow-400",
        low: "text-zinc-500",
      };
      return (
        <ul className="space-y-2">
          {objArray(content.items).map((item, i) => (
            <li key={i} className="flex gap-3 text-zinc-200">
              <span
                className={`text-xs font-mono shrink-0 uppercase pt-0.5 ${PRIORITY_COLORS[str(item.priority) as keyof typeof PRIORITY_COLORS] ?? "text-zinc-500"}`}
              >
                {str(item.priority) || "—"}
              </span>
              <div>
                <span>{str(item.task)}</span>
                {str(item.owner) && (
                  <span className="text-zinc-400 text-sm">
                    {" "}
                    — {str(item.owner)}
                  </span>
                )}
                {str(item.due) && (
                  <span className="text-zinc-500 text-sm">
                    {" "}
                    by {str(item.due)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      );
    }

    case "JOURNAL": {
      const followUp = strArray(content.follow_up);
      return (
        <div className="space-y-4">
          {str(content.mood) && (
            <p className="text-zinc-400 italic">{str(content.mood)}</p>
          )}
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
              Key Insights
            </h3>
            <ul className="space-y-2">
              {strArray(content.key_insights).map((i, idx) => (
                <li key={idx} className="text-zinc-200 pl-3">
                  {i}
                </li>
              ))}
            </ul>
          </div>
          {followUp.length > 0 && (
            <div>
              <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
                Follow Up
              </h3>
              <ul className="space-y-1">
                {followUp.map((f, i) => (
                  <li key={i} className="text-zinc-200 pl-3">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    case "PROBLEM":
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-1">
              Context
            </h3>
            <p className="text-zinc-200">{str(content.context)}</p>
          </div>
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-1">
              Problem
            </h3>
            <p className="text-zinc-200">{str(content.problem)}</p>
          </div>
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
              Options
            </h3>
            <ul className="space-y-1">
              {strArray(content.options).map((o, i) => (
                <li key={i} className="text-zinc-200 pl-3">
                  {o}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-1">
              Recommendation
            </h3>
            <p className="text-zinc-200 font-medium">
              {str(content.recommendation)}
            </p>
          </div>
        </div>
      );

    default:
      return (
        <pre className="text-zinc-400 text-sm whitespace-pre-wrap">
          {typeof content.transcript === "string"
            ? content.transcript
            : JSON.stringify(content, null, 2)}
        </pre>
      );
  }
}
