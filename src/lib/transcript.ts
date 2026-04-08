import type { Transcript } from "../schemas/episode";

export function transcriptToPlainText(transcript: Transcript): string {
  if (typeof transcript === "string") return transcript;
  return transcript.map((s) => s.text).join("\n\n");
}
