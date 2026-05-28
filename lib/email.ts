import { Resend } from "resend";
import type { StructuredNote } from "./structure";

const resend = new Resend(process.env.RESEND_API_KEY!);

function renderContent(note: StructuredNote): string {
  const c = note.content as Record<string, unknown>;

  switch (note.type) {
    case "LIST":
      return `<ul>${(c.items as string[]).map((i) => `<li>${i}</li>`).join("")}</ul>`;

    case "BRAINSTORM":
      return (c.clusters as { theme: string; ideas: string[] }[])
        .map(
          (cl) =>
            `<h3>${cl.theme}</h3><ul>${cl.ideas.map((i) => `<li>${i}</li>`).join("")}</ul>`
        )
        .join("");

    case "POSTMORTEM":
      return (
        ["what_happened", "root_cause", "impact", "prevention"]
          .map(
            (k) =>
              `<h3>${k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</h3><p>${c[k]}</p>`
          )
          .join("") +
        `<h3>Actions</h3><ul>${(c.actions as string[]).map((a) => `<li>${a}</li>`).join("")}</ul>`
      );

    case "MEETING":
      return (
        `<h3>Decisions</h3><ul>${(c.decisions as string[]).map((d) => `<li>${d}</li>`).join("")}</ul>` +
        `<h3>Action Items</h3><ul>${(
          c.action_items as { task: string; owner: string; due: string }[]
        )
          .map(
            (a) =>
              `<li><strong>${a.task}</strong> — ${a.owner}${a.due ? ` by ${a.due}` : ""}</li>`
          )
          .join("")}</ul>`
      );

    case "ACTION_ITEMS":
      return `<ul>${(
        c.items as {
          task: string;
          priority: string;
          owner: string;
          due: string;
        }[]
      )
        .map(
          (i) =>
            `<li>[${i.priority.toUpperCase()}] ${i.task}${i.owner ? ` — ${i.owner}` : ""}${i.due ? ` by ${i.due}` : ""}</li>`
        )
        .join("")}</ul>`;

    case "JOURNAL":
      return (
        `<h3>Key Insights</h3><ul>${(c.key_insights as string[]).map((i) => `<li>${i}</li>`).join("")}</ul>` +
        (c.mood ? `<p><em>Mood: ${c.mood}</em></p>` : "") +
        (c.follow_up && (c.follow_up as string[]).length
          ? `<h3>Follow Up</h3><ul>${(c.follow_up as string[]).map((f) => `<li>${f}</li>`).join("")}</ul>`
          : "")
      );

    case "PROBLEM":
      return (
        `<h3>Context</h3><p>${c.context}</p>` +
        `<h3>Problem</h3><p>${c.problem}</p>` +
        `<h3>Options</h3><ul>${(c.options as string[]).map((o) => `<li>${o}</li>`).join("")}</ul>` +
        `<h3>Recommendation</h3><p>${c.recommendation}</p>`
      );

    default:
      return `<pre style="white-space:pre-wrap;">${JSON.stringify(c, null, 2)}</pre>`;
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
        <h2 style="margin-bottom: 4px;">${note.title}</h2>
        <p style="color: #888; font-size: 12px; margin-top: 0;">${note.type}</p>
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
