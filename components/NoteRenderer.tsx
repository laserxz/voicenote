interface Props {
  noteType: string;
  content: Record<string, unknown>;
}

export function NoteRenderer({ noteType, content }: Props) {
  switch (noteType) {
    case "LIST":
      return (
        <ul className="space-y-2">
          {(content.items as string[]).map((item, i) => (
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
          {(content.clusters as { theme: string; ideas: string[] }[]).map(
            (cl, i) => (
              <div key={i}>
                <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
                  {cl.theme}
                </h3>
                <ul className="space-y-1">
                  {cl.ideas.map((idea, j) => (
                    <li key={j} className="text-zinc-200 pl-3">
                      {idea}
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
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
              <p className="text-zinc-200">{content[k] as string}</p>
            </div>
          ))}
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
              Actions
            </h3>
            <ul className="space-y-1">
              {(content.actions as string[]).map((a, i) => (
                <li key={i} className="text-zinc-200 pl-3">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );

    case "MEETING":
      return (
        <div className="space-y-4">
          {(content.attendees as string[]).length > 0 && (
            <div>
              <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
                Attendees
              </h3>
              <p className="text-zinc-200">
                {(content.attendees as string[]).join(", ")}
              </p>
            </div>
          )}
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
              Decisions
            </h3>
            <ul className="space-y-1">
              {(content.decisions as string[]).map((d, i) => (
                <li key={i} className="text-zinc-200 pl-3">
                  {d}
                </li>
              ))}
            </ul>
          </div>
          {(content.action_items as { task: string; owner: string; due: string }[]).length > 0 && (
            <div>
              <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
                Action Items
              </h3>
              <ul className="space-y-2">
                {(
                  content.action_items as {
                    task: string;
                    owner: string;
                    due: string;
                  }[]
                ).map((a, i) => (
                  <li key={i} className="text-zinc-200 pl-3">
                    <span className="font-medium">{a.task}</span>
                    {a.owner && (
                      <span className="text-zinc-400"> — {a.owner}</span>
                    )}
                    {a.due && (
                      <span className="text-zinc-500"> by {a.due}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

    case "ACTION_ITEMS": {
      const PRIORITY_COLORS = {
        high: "text-red-400",
        medium: "text-yellow-400",
        low: "text-zinc-500",
      };
      return (
        <ul className="space-y-2">
          {(
            content.items as {
              task: string;
              priority: string;
              owner: string;
              due: string;
            }[]
          ).map((item, i) => (
            <li key={i} className="flex gap-3 text-zinc-200">
              <span
                className={`text-xs font-mono shrink-0 uppercase pt-0.5 ${PRIORITY_COLORS[item.priority as keyof typeof PRIORITY_COLORS] ?? "text-zinc-500"}`}
              >
                {item.priority}
              </span>
              <div>
                <span>{item.task}</span>
                {item.owner && (
                  <span className="text-zinc-400 text-sm"> — {item.owner}</span>
                )}
                {item.due && (
                  <span className="text-zinc-500 text-sm"> by {item.due}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      );
    }

    case "JOURNAL":
      return (
        <div className="space-y-4">
          {content.mood != null && (
            <p className="text-zinc-400 italic">{String(content.mood)}</p>
          )}
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
              Key Insights
            </h3>
            <ul className="space-y-2">
              {(content.key_insights as string[]).map((i, idx) => (
                <li key={idx} className="text-zinc-200 pl-3">
                  {i}
                </li>
              ))}
            </ul>
          </div>
          {(content.follow_up as string[]).length > 0 && (
            <div>
              <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
                Follow Up
              </h3>
              <ul className="space-y-1">
                {(content.follow_up as string[]).map((f, i) => (
                  <li key={i} className="text-zinc-200 pl-3">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

    case "PROBLEM":
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-1">
              Context
            </h3>
            <p className="text-zinc-200">{content.context as string}</p>
          </div>
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-1">
              Problem
            </h3>
            <p className="text-zinc-200">{content.problem as string}</p>
          </div>
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-2">
              Options
            </h3>
            <ul className="space-y-1">
              {(content.options as string[]).map((o, i) => (
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
              {content.recommendation as string}
            </p>
          </div>
        </div>
      );

    default:
      return (
        <pre className="text-zinc-400 text-sm whitespace-pre-wrap">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
  }
}
