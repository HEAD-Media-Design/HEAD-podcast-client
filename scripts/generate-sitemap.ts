/**
 * Build-time sitemap from `content/episodes/*.json`.
 * Site origin: `VITE_SITE_URL` in repo `.env` (same as RSS / index.html). Override with `PODCAST_SITE_URL` in CI if needed.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEpisodeJsonFiles } from "./content-utils.ts";
import { applyRootDotEnv } from "./load-root-env.ts";

const repoRoot = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
applyRootDotEnv(repoRoot);

const OUT_SITEMAP = path.join(repoRoot, "public", "sitemap.xml");
const OUT_ROBOTS = path.join(repoRoot, "public", "robots.txt");

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** W3C date (YYYY-MM-DD) for sitemap lastmod. */
function lastmodDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

async function main() {
  const siteUrl = (
    process.env.PODCAST_SITE_URL ??
    process.env.VITE_SITE_URL ??
    "https://example.com"
  ).replace(/\/$/, "");
  const episodes = await loadEpisodeJsonFiles();

  const homeLoc = escapeXml(`${siteUrl}/`);
  const latestHomeMod =
    episodes.length > 0 ? lastmodDay(episodes[0]!.publishedAt) : "";

  const episodeUrls = episodes.map((ep) => {
    const loc = escapeXml(
      `${siteUrl}/episode/${encodeURIComponent(ep.slug)}`,
    );
    const mod = lastmodDay(ep.publishedAt);
    const lastmodLine = mod ? `\n    <lastmod>${mod}</lastmod>` : "";
    return `  <url>
    <loc>${loc}</loc>${lastmodLine}
    <changefreq>monthly</changefreq>
  </url>`;
  });

  const homeLastmodLine = latestHomeMod
    ? `\n    <lastmod>${latestHomeMod}</lastmod>`
    : "";

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${homeLoc}</loc>${homeLastmodLine}
    <changefreq>weekly</changefreq>
  </url>
${episodeUrls.join("\n")}
</urlset>
`;

  const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

  await mkdir(path.dirname(OUT_SITEMAP), { recursive: true });
  await writeFile(OUT_SITEMAP, sitemap, "utf8");
  await writeFile(OUT_ROBOTS, robots, "utf8");
  console.log(
    `Wrote ${OUT_SITEMAP} and ${OUT_ROBOTS} (${episodes.length} episode URLs, site: ${siteUrl})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
