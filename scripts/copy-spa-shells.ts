/**
 * After `vite build`, duplicate the SPA shell so static hosts can serve
 * /episode/:slug/ without a server rewrite (each slug gets its own index.html).
 */
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEpisodeJsonFiles } from "./content-utils.ts";

const repoRoot = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
const distIndex = path.join(repoRoot, "dist", "index.html");

async function main() {
  const episodes = await loadEpisodeJsonFiles();
  for (const ep of episodes) {
    const dir = path.join(repoRoot, "dist", "episode", ep.slug);
    await mkdir(dir, { recursive: true });
    await copyFile(distIndex, path.join(dir, "index.html"));
  }
  console.log(
    `Copied SPA shell to dist/episode/<slug>/index.html (${episodes.length} routes).`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
