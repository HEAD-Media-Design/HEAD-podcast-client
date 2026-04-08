import { z } from "zod";

import {
  episodeJsonSchema,
  transcriptSchema,
  type Episode,
  type Transcript,
} from "../schemas/episode";

const episodeJsonModules = import.meta.glob("../../content/episodes/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const transcriptFileModules = import.meta.glob(
  "../../content/episodes/*.transcript.json",
  { eager: true, import: "default" },
) as Record<string, unknown>;

function basename(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

function isTranscriptEpisodeFilename(name: string): boolean {
  return name.endsWith(".transcript.json");
}

const transcriptsByFilename = new Map<string, Transcript>();
for (const [path, mod] of Object.entries(transcriptFileModules)) {
  const file = basename(path);
  transcriptsByFilename.set(file, transcriptSchema.parse(mod));
}

function mergeEpisode(parsed: z.infer<typeof episodeJsonSchema>): Episode {
  const { transcriptFile, transcript: inlineTranscript, ...rest } = parsed;

  let transcript: Transcript;
  if (inlineTranscript !== undefined) {
    transcript = inlineTranscript;
  } else if (transcriptFile) {
    const t = transcriptsByFilename.get(transcriptFile);
    if (t === undefined) {
      throw new Error(
        `[episodes] Missing transcript file "${transcriptFile}" for slug "${parsed.slug}"`,
      );
    }
    transcript = t;
  } else {
    throw new Error(`[episodes] Invalid episode state for slug "${parsed.slug}"`);
  }

  return { ...rest, transcript };
}

const rawEpisodes: Episode[] = [];

for (const [path, mod] of Object.entries(episodeJsonModules)) {
  const file = basename(path);
  if (isTranscriptEpisodeFilename(file)) continue;

  const parsed = episodeJsonSchema.parse(mod);
  if (parsed.published === false) continue;
  rawEpisodes.push(mergeEpisode(parsed));
}

rawEpisodes.sort(
  (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
);

export const EPISODES: readonly Episode[] = rawEpisodes;

export function episodeBodyText(episode: Episode): string {
  return episode.showNotes ?? episode.summary;
}
