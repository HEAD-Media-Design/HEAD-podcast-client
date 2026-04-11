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

/** Re-copy from `public/` so root URLs like `/og-image.png` always exist in `dist/` (Vite copies too; this guards CI/CD edge cases). */
const ROOT_STATIC_FROM_PUBLIC = [
  "og-image.png",
  "og-image.jpg",
  "favicon.svg",
  "robots.txt",
  "podcast.rss",
  "sitemap.xml",
] as const;

async function copyRootStaticFromPublic() {
  await Promise.all(
    ROOT_STATIC_FROM_PUBLIC.map((name) =>
      copyFile(path.join(repoRoot, "public", name), path.join(repoRoot, "dist", name)),
    ),
  );
}

async function main() {
  const episodes = await loadEpisodeJsonFiles();
  for (const ep of episodes) {
    const dir = path.join(repoRoot, "dist", "episode", ep.slug);
    await mkdir(dir, { recursive: true });
    await copyFile(distIndex, path.join(dir, "index.html"));
  }
  await copyRootStaticFromPublic();
  console.log(
    `Copied SPA shell to dist/episode/<slug>/index.html (${episodes.length} routes).`,
  );
  console.log(
    `Re-copied root static assets: ${ROOT_STATIC_FROM_PUBLIC.join(", ")}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
