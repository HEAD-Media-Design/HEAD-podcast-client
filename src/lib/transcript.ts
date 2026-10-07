import type { Transcript, TranscriptSegment } from "../schemas/episode";

export type TranscriptBlock = {
  text: string;
  speaker?: string;
};

export function transcriptToPlainText(transcript: Transcript): string {
  if (typeof transcript === "string") return transcript;
  return transcript.map((s) => s.text).join("\n\n");
}

/**
 * A paragraph that is only a short name followed by a colon, e.g. `Mai Ha:` or `MH:`. No space
 * before the colon, so French narration like `Louis nous confie :` is not taken for a label.
 */
const SPEAKER_LABEL_RE = /^([^"“«\n.?!]{0,39}[^\s"“«.?!]):$/;

const QUOTE_OPEN_RE = /^["“«]/;
const QUOTE_CLOSE_RE = /["”»]$/;

/** Paragraphs longer than this are broken at sentence boundaries so they stay easy to read. */
const MAX_PARAGRAPH_CHARS = 320;

const SENTENCE_BREAK_RE = /(?<=[.!?…。][»"”')\]]?)\s+(?=["“«'(]?\p{Lu})/u;

/** Splits one long paragraph into shorter ones, each made of whole sentences. */
export function splitLongParagraph(paragraph: string): string[] {
  if (paragraph.length <= MAX_PARAGRAPH_CHARS) return [paragraph];
  const chunks: string[] = [];
  let current = "";
  for (const sentence of paragraph.split(SENTENCE_BREAK_RE)) {
    if (current && current.length + sentence.length + 1 > MAX_PARAGRAPH_CHARS) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Splits every paragraph of `text` (separated by blank lines) that is too long. */
export function toReadableParagraphs(text: string): string {
  return text
    .split(/\n\n+/)
    .flatMap((p) => splitLongParagraph(p.trim()))
    .join("\n\n");
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

/**
 * Paragraphs from a string transcript. A `Name:` paragraph labels the quote that follows it;
 * a quote spanning several paragraphs runs until its closing quote mark. Initials-only labels
 * (`MH:`) resolve to an earlier full name with the same initials. Long paragraphs are split
 * into shorter ones.
 */
function stringTranscriptToBlocks(transcript: string): TranscriptBlock[] {
  const paragraphs = transcript
    .split(/\n\n+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const fullNames: string[] = [];
  const blocks: TranscriptBlock[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const label = paragraphs[i].match(SPEAKER_LABEL_RE)?.[1].trim();
    if (!label || i + 1 >= paragraphs.length) {
      for (const text of splitLongParagraph(paragraphs[i]))
        blocks.push({ text });
      continue;
    }

    let speaker = label;
    if (/^[A-Z]{2,4}$/.test(label)) {
      speaker = fullNames.find((n) => initials(n) === label) ?? label;
    } else if (!fullNames.includes(label)) {
      fullNames.push(label);
    }

    const quote = [paragraphs[++i]];
    if (QUOTE_OPEN_RE.test(quote[0]) && !QUOTE_CLOSE_RE.test(quote[0])) {
      while (
        i + 1 < paragraphs.length &&
        !SPEAKER_LABEL_RE.test(paragraphs[i + 1])
      ) {
        quote.push(paragraphs[++i]);
        if (QUOTE_CLOSE_RE.test(paragraphs[i])) break;
      }
    }
    blocks.push({ speaker, text: toReadableParagraphs(quote.join("\n\n")) });
  }
  return blocks;
}

/** Blocks for UI: one item per segment, or paragraphs split from a string transcript. */
export function transcriptToBlocks(transcript: Transcript): TranscriptBlock[] {
  if (typeof transcript === "string")
    return stringTranscriptToBlocks(transcript);
  return transcript.map((s: TranscriptSegment) => ({
    text: s.text.trim(),
    speaker: s.speaker,
  }));
}
