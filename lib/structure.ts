import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type NoteType =
  | "LIST"
  | "BRAINSTORM"
  | "POSTMORTEM"
  | "MEETING"
  | "ACTION_ITEMS"
  | "JOURNAL"
  | "PROBLEM"
  | "RAW";

export interface StructuredNote {
  type: NoteType;
  title: string;
  content: Record<string, unknown>;
}

const TYPE_SCHEMAS: Record<NoteType, string> = {
  LIST: `{ "items": ["string"] }`,
  BRAINSTORM: `{ "clusters": [{ "theme": "string", "ideas": ["string"] }] }`,
  POSTMORTEM: `{ "what_happened": "string", "root_cause": "string", "impact": "string", "actions": ["string"], "prevention": "string" }`,
  MEETING: `{ "attendees": ["string"], "agenda": ["string"], "decisions": ["string"], "action_items": [{ "task": "string", "owner": "string", "due": "string" }] }`,
  ACTION_ITEMS: `{ "items": [{ "task": "string", "priority": "high|medium|low", "owner": "string", "due": "string" }] }`,
  JOURNAL: `{ "key_insights": ["string"], "mood": "string", "follow_up": ["string"] }`,
  PROBLEM: `{ "context": "string", "problem": "string", "options": ["string"], "recommendation": "string" }`,
  RAW: `{ "transcript": "string" }`,
};

export async function structureNote(
  transcript: string
): Promise<StructuredNote> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `You are a voice note organiser. Given a raw transcript, detect the note type and return structured JSON.

Note types and their schemas:
${Object.entries(TYPE_SCHEMAS)
  .map(([k, v]) => `${k}: ${v}`)
  .join("\n")}

Detection rules:
- LIST: enumerated items, shopping/todo lists
- BRAINSTORM: ideas, options, possibilities being explored
- POSTMORTEM: incidents, what went wrong, root cause analysis
- MEETING: discussion with people, decisions made
- ACTION_ITEMS: tasks with owners or deadlines
- JOURNAL: personal reflection, first-person narrative
- PROBLEM: problem definition, analysis, options
- RAW: fallback for unclassifiable content

Return ONLY valid JSON in this exact format, no preamble:
{
  "type": "NOTE_TYPE",
  "title": "Short descriptive title (max 8 words)",
  "content": { ...matching schema for type... }
}

Transcript:
${transcript}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean) as StructuredNote;
}
