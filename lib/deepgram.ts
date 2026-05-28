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
    }
  );

  const r = response as ListenV1Response;
  const transcript =
    r.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  const duration = Math.round(r.metadata?.duration ?? 0);

  return { transcript, duration };
}
