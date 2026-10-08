import { useEffect, useState } from "react";

import type { Episode } from "../schemas/episode";

/**
 * Map of slug -> duration (seconds). Uses `durationSeconds` from the episode data; only episodes
 * without it fall back to loading audio metadata (each probe costs requests on mobile).
 */
export function usePodcastDurations(podcasts: Episode[] | undefined) {
  const [durations, setDurations] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!podcasts?.length) return;

    const known = Object.fromEntries(
      podcasts
        .filter((p) => p.durationSeconds !== undefined)
        .map((p) => [p.slug, p.durationSeconds!]),
    );
    setDurations((prev) => ({ ...prev, ...known }));

    podcasts.forEach((podcast) => {
      const url = podcast.audioUrl;
      if (!url || podcast.durationSeconds !== undefined) return;

      const audio = new Audio();
      audio.preload = "metadata";

      const onLoaded = () => {
        if (Number.isFinite(audio.duration)) {
          setDurations((prev) => ({ ...prev, [podcast.slug]: audio.duration }));
        }
      };

      audio.addEventListener("loadedmetadata", onLoaded, { once: true });
      audio.addEventListener("error", () => {}, { once: true });
      audio.src = url;
    });
  }, [podcasts]);

  return durations;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "–:––";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
