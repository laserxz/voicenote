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

const NOTE_TYPES: NoteType[] = [
  "LIST",
  "BRAINSTORM",
  "POSTMORTEM",
  "MEETING",
  "ACTION_ITEMS",
  "JOURNAL",
  "PROBLEM",
  "RAW",
];

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

export function fallbackTitle(transcript: string): string {
  const words = transcript.trim().split(/\s+/).slice(0, 8).join(" ");
  return words.length < transcript.trim().length ? `${words}…` : words;
}

export function rawNote(transcript: string): StructuredNote {
  return {
    type: "RAW",
    title: fallbackTitle(transcript),
    content: { transcript },
  };
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(str).filter((s) => s.length > 0) : [];
}

function objArray<T>(v: unknown, map: (o: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((o): o is Record<string, unknown> => o != null && typeof o === "object")
    .map(map);
}

// Coerce LLM output into the exact shape each renderer expects, so a
// slightly-off response can never produce a note that crashes on display.
export function normalizeStructured(
  raw: unknown,
  transcript: string
): StructuredNote {
  if (raw == null || typeof raw !== "object") return rawNote(transcript);
  const r = raw as Record<string, unknown>;
  const type = NOTE_TYPES.includes(r.type as NoteType)
    ? (r.type as NoteType)
    : "RAW";
  const title = str(r.title).trim() || fallbackTitle(transcript);
  const c =
    r.content != null && typeof r.content === "object"
      ? (r.content as Record<string, unknown>)
      : {};

  switch (type) {
    case "LIST": {
      const items = strArray(c.items);
      if (items.length === 0) return rawNote(transcript);
      return { type, title, content: { items } };
    }
    case "BRAINSTORM": {
      const clusters = objArray(c.clusters, (o) => ({
        theme: str(o.theme),
        ideas: strArray(o.ideas),
      })).filter((cl) => cl.ideas.length > 0);
      if (clusters.length === 0) return rawNote(transcript);
      return { type, title, content: { clusters } };
    }
    case "POSTMORTEM":
      return {
        type,
        title,
        content: {
          what_happened: str(c.what_happened),
          root_cause: str(c.root_cause),
          impact: str(c.impact),
          actions: strArray(c.actions),
          prevention: str(c.prevention),
        },
      };
    case "MEETING":
      return {
        type,
        title,
        content: {
          attendees: strArray(c.attendees),
          agenda: strArray(c.agenda),
          decisions: strArray(c.decisions),
          action_items: objArray(c.action_items, (o) => ({
            task: str(o.task),
            owner: str(o.owner),
            due: str(o.due),
          })),
        },
      };
    case "ACTION_ITEMS": {
      const items = objArray(c.items, (o) => ({
        task: str(o.task),
        priority: ["high", "medium", "low"].includes(str(o.priority))
          ? str(o.priority)
          : "medium",
        owner: str(o.owner),
        due: str(o.due),
      })).filter((i) => i.task.length > 0);
      if (items.length === 0) return rawNote(transcript);
      return { type, title, content: { items } };
    }
    case "JOURNAL":
      return {
        type,
        title,
        content: {
          key_insights: strArray(c.key_insights),
          mood: str(c.mood),
          follow_up: strArray(c.follow_up),
        },
      };
    case "PROBLEM":
      return {
        type,
        title,
        content: {
          context: str(c.context),
          problem: str(c.problem),
          options: strArray(c.options),
          recommendation: str(c.recommendation),
        },
      };
    case "RAW":
    default:
      return { type: "RAW", title, content: { transcript } };
  }
}

export async function structureNote(
  transcript: string
): Promise<StructuredNote> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    tools: [
      {
        name: "save_note",
        description: "Save the structured note extracted from the transcript.",
        input_schema: {
          type: "object" as const,
          properties: {
            type: { type: "string", enum: NOTE_TYPES },
            title: {
              type: "string",
              description: "Short descriptive title (max 8 words)",
            },
            content: {
              type: "object",
              description: "Content matching the schema for the chosen type",
            },
          },
          required: ["type", "title", "content"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "save_note" },
    messages: [
      {
        role: "user",
        content: `You are a voice note organiser. Given a raw transcript, detect the note type and save a structured note.

Note types and their content schemas:
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

Multi-speaker transcripts: lines may be tagged "Speaker 1:", "Speaker 2:"
etc. — these are anonymous voice labels from diarization. Such transcripts
are usually MEETING. Work out real names from context (people addressing
each other) and use them for attendees and action-item owners; where a name
never surfaces, keep the label (e.g. "Speaker 2"). Attribute decisions and
action items to the person who took them, not to whoever mentioned them.

Transcript:
${transcript}`,
      },
    ],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("Structuring output truncated (max_tokens)");
  }

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("No tool_use block in structuring response");
  }

  return normalizeStructured(block.input, transcript);
}
