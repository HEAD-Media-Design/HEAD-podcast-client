import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { episodeJsonSchema } from "../src/schemas/episode.ts";

const repoRoot = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
export const EPISODES_DIR = path.join(repoRoot, "content", "episodes");

export async function loadEpisodeJsonFiles(): Promise<
  ReturnType<typeof episodeJsonSchema.parse>[]
> {
  const files = await readdir(EPISODES_DIR);
  const out: ReturnType<typeof episodeJsonSchema.parse>[] = [];

  for (const name of files) {
    if (!name.endsWith(".json") || name.endsWith(".transcript.json")) continue;
    const raw: unknown = JSON.parse(
      await readFile(path.join(EPISODES_DIR, name), "utf8"),
    );
    const parsed = episodeJsonSchema.parse(raw);
    if (parsed.published === false) continue;
    out.push(parsed);
  }

  out.sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
  return out;
}
