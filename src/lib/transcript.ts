import type { Transcript, TranscriptSegment } from "../schemas/episode";

export type TranscriptBlock = {
  text: string;
  speaker?: string;
};

export function transcriptToPlainText(transcript: Transcript): string {
  if (typeof transcript === "string") return transcript;
  return transcript.map((s) => s.text).join("\n\n");
}

/** Blocks for UI: one item per segment, or paragraphs split from a string transcript. */
export function transcriptToBlocks(transcript: Transcript): TranscriptBlock[] {
  if (typeof transcript === "string") {
    return transcript
      .split(/\n\n+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text }));
  }
  return transcript.map((s: TranscriptSegment) => ({
    text: s.text.trim(),
    speaker: s.speaker,
  }));
}
