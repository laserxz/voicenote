import { createClient } from "@deepgram/sdk";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<{ transcript: string; duration: number }> {
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioBuffer,
    {
      model: "nova-3",
      smart_format: true,
      punctuate: true,
      language: "en-AU",
    }
  );

  if (error) throw new Error(`Deepgram error: ${error.message}`);

  const transcript =
    result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
  const duration = Math.round(result?.metadata?.duration ?? 0);

  return { transcript, duration };
}
