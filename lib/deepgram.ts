import { DeepgramClient } from "@deepgram/sdk";
import type { ListenV1Response } from "@deepgram/sdk";

const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY! });

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<{ transcript: string; duration: number }> {
  const response = await deepgram.listen.v1.media.transcribeFile(
    audioBuffer,
    {
      model: "nova-3",
      smart_format: true,
      punctuate: true,
      language: "en-AU",
      diarize: true,
      utterances: true,
    }
  );

  const r = response as ListenV1Response;
  const flat = r.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  const duration = Math.round(r.metadata?.duration ?? 0);

  // If diarization found more than one voice, build a speaker-tagged
  // transcript; a solo recording stays a plain block of text.
  const utterances = r.results?.utterances ?? [];
  const speakers = new Set(
    utterances.map((u) => u.speaker).filter((s) => s !== undefined)
  );

  if (utterances.length > 0 && speakers.size > 1) {
    const lines: { speaker: number; text: string }[] = [];
    for (const u of utterances) {
      const speaker = u.speaker ?? 0;
      const text = (u.transcript ?? "").trim();
      if (!text) continue;
      const last = lines[lines.length - 1];
      if (last && last.speaker === speaker) {
        last.text += ` ${text}`;
      } else {
        lines.push({ speaker, text });
      }
    }
    const transcript = lines
      .map((l) => `Speaker ${l.speaker + 1}: ${l.text}`)
      .join("\n");
    return { transcript, duration };
  }

  return { transcript: flat, duration };
}
