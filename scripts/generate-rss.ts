/**
 * Build-time RSS 2.0 feed from content/episodes/*.json
 * Site origin: `VITE_SITE_URL` in repo `.env` (same as index.html). Override with `PODCAST_SITE_URL` in CI if needed.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadEpisodeJsonFiles } from "./content-utils.ts";
import { applyRootDotEnv } from "./load-root-env.ts";

const repoRoot = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
applyRootDotEnv(repoRoot);
const OUT_FILE = path.join(repoRoot, "public", "podcast.rss");

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rfc822Date(iso: string): string {
  return new Date(iso).toUTCString();
}

async function main() {
  const siteUrl = (
    process.env.PODCAST_SITE_URL ??
    process.env.VITE_SITE_URL ??
    "https://example.com"
  ).replace(/\/$/, "");
  const episodes = await loadEpisodeJsonFiles();

  const channelTitle = "HEAD-Genève Media Design Podcasts";
  const channelDescription =
    "Podcasts from HEAD–Genève Media Design (static feed from repo JSON).";
  const channelLink = siteUrl;

  const items = episodes
    .map((ep) => {
      const pageUrl = `${siteUrl}/episode/${encodeURIComponent(ep.slug)}`;
      const pub = rfc822Date(ep.publishedAt);
      const desc = escapeXml(ep.summary);
      const encUrl = escapeXml(ep.audioUrl);
      return `    <item>
      <title>${escapeXml(ep.title)}</title>
      <link>${escapeXml(pageUrl)}</link>
      <guid isPermaLink="true">${escapeXml(pageUrl)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${desc}</description>
      <enclosure url="${encUrl}" type="audio/mpeg" length="0" />
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(`${siteUrl}/podcast.rss`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, xml, "utf8");
  console.log(`Wrote ${OUT_FILE} (${episodes.length} episodes, site: ${siteUrl})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
