import { Resend } from "resend";
import type { StructuredNote } from "./structure";

const resend = new Resend(process.env.RESEND_API_KEY!);

// Transcript-derived content is untrusted — always escape before
// interpolating into email HTML.
function esc(v: unknown): string {
  const s = typeof v === "string" ? v : v == null ? "" : String(v);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function strArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.map((x) => (typeof x === "string" ? x : String(x ?? ""))).filter(Boolean)
    : [];
}

function objArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v)
    ? v.filter(
        (o): o is Record<string, unknown> => o != null && typeof o === "object"
      )
    : [];
}

function ul(items: string[]): string {
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

function renderContent(note: StructuredNote): string {
  const c = note.content as Record<string, unknown>;

  switch (note.type) {
    case "LIST":
      return ul(strArray(c.items));

    case "BRAINSTORM":
      return objArray(c.clusters)
        .map(
          (cl) => `<h3>${esc(cl.theme)}</h3>${ul(strArray(cl.ideas))}`
        )
        .join("");

    case "POSTMORTEM":
      return (
        ["what_happened", "root_cause", "impact", "prevention"]
          .map(
            (k) =>
              `<h3>${k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</h3><p>${esc(c[k])}</p>`
          )
          .join("") + `<h3>Actions</h3>${ul(strArray(c.actions))}`
      );

    case "MEETING":
      return (
        `<h3>Decisions</h3>${ul(strArray(c.decisions))}` +
        `<h3>Action Items</h3><ul>${objArray(c.action_items)
          .map(
            (a) =>
              `<li><strong>${esc(a.task)}</strong>${a.owner ? ` — ${esc(a.owner)}` : ""}${a.due ? ` by ${esc(a.due)}` : ""}</li>`
          )
          .join("")}</ul>`
      );

    case "ACTION_ITEMS":
      return `<ul>${objArray(c.items)
        .map(
          (i) =>
            `<li>[${esc(String(i.priority ?? "").toUpperCase())}] ${esc(i.task)}${i.owner ? ` — ${esc(i.owner)}` : ""}${i.due ? ` by ${esc(i.due)}` : ""}</li>`
        )
        .join("")}</ul>`;

    case "JOURNAL": {
      const followUp = strArray(c.follow_up);
      return (
        `<h3>Key Insights</h3>${ul(strArray(c.key_insights))}` +
        (c.mood ? `<p><em>Mood: ${esc(c.mood)}</em></p>` : "") +
        (followUp.length ? `<h3>Follow Up</h3>${ul(followUp)}` : "")
      );
    }

    case "PROBLEM":
      return (
        `<h3>Context</h3><p>${esc(c.context)}</p>` +
        `<h3>Problem</h3><p>${esc(c.problem)}</p>` +
        `<h3>Options</h3>${ul(strArray(c.options))}` +
        `<h3>Recommendation</h3><p>${esc(c.recommendation)}</p>`
      );

    default:
      return `<pre style="white-space:pre-wrap;">${esc(
        typeof c.transcript === "string"
          ? c.transcript
          : JSON.stringify(c, null, 2)
      )}</pre>`;
  }
}

export async function emailNote(
  noteId: string,
  note: StructuredNote
): Promise<void> {
  const appUrl = process.env.NEXTAUTH_URL;

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: process.env.EMAIL_TO_DEFAULT!,
    subject: `[VoiceNote] ${note.type}: ${note.title}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <h2 style="margin-bottom: 4px;">${esc(note.title)}</h2>
        <p style="color: #888; font-size: 12px; margin-top: 0;">${esc(note.type)}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;"/>
        ${renderContent(note)}
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;"/>
        <p style="color: #aaa; font-size: 12px;">
          <a href="${appUrl}/notes/${noteId}" style="color: #666;">View in VoiceNote</a>
        </p>
      </div>
    `,
  });
}
