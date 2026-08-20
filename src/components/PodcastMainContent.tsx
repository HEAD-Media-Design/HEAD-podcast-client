import React, { useCallback, useMemo, useRef } from "react";

import NextButton from "./NextButton";
import P5Canvas from "./P5Canvas";
import { episodeBodyText } from "../data/episodes";
import type { Episode } from "../schemas/episode";
import { transcriptToBlocks, transcriptToPlainText } from "../lib/transcript";
import PrevButton from "./PrevButton";
import { algoTitleSketch } from "../sketches/algoTitleSketch";
import { audioReactiveSketch } from "../sketches/audioReactiveSketch";

interface PodcastMainContentProps {
  currentPodcast: Episode;
  nextPodcast: Episode | null;
  onPrevPodcast: () => void;
  onNextPodcast: () => void;
  onPlayNext?: () => void;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  simulatedLevelRef: React.MutableRefObject<number>;
  isConnected: boolean;
  isPlaying: boolean;
  currentTime: number;
  outputLatency: number;
  /** Playlist index (0-based); p5 viz cycles theme 1–2–3 by this order. */
  playbackOrderIndex: number;
  /** After first play, left panel uses audio-reactive sketch instead of idle title. */
  hasUserPlayedAudio: boolean;
  isPlayButtonHovered: boolean;
}

const DEFAULT_TRANSCRIPT =
  "Hi folks, welcome to Supernova, where we discuss algorithms beyond us. I'm your host Peter Ha and I'll be talking about mobile photography and how we select and manage photos.";

const SWIPE_MIN_PX = 56;
/** Require horizontal movement to dominate vertical (avoid triggering while scrolling transcript). */
const SWIPE_HORIZONTAL_RATIO = 1.25;

function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < 768;
}

function TranscriptBlocks({
  blocks,
}: {
  blocks: ReturnType<typeof transcriptToBlocks>;
}) {
  return (
    <>
      {blocks.map((block, i) => (
        <div
          key={i}
          className={
            block.speaker ? "mb-6 flex gap-4 md:mb-8 md:gap-8" : "mb-5 md:mb-6"
          }
        >
          {block.speaker ? (
            <>
              <p className="w-[6.75rem] shrink-0 pt-0.5 font-spline-sans text-[8px] font-bold uppercase leading-tight tracking-wide text-black md:w-32 md:text-[14px]">
                {block.speaker}
              </p>
              <p className="min-w-0 flex-1 text-left font-spline-sans text-[11px] text-black md:text-[18px]">
                {block.text}
              </p>
            </>
          ) : (
            <p className="text-left font-spline-sans text-[11px] text-black md:text-[18px]">
              {block.text}
            </p>
          )}
        </div>
      ))}
    </>
  );
}

const PodcastMainContent: React.FC<PodcastMainContentProps> = ({
  currentPodcast,
  nextPodcast,
  onPrevPodcast,
  onNextPodcast,
  onPlayNext,
  analyserRef,
  simulatedLevelRef,
  isConnected,
  isPlaying,
  currentTime,
  outputLatency,
  playbackOrderIndex,
  hasUserPlayedAudio,
  isPlayButtonHovered,
}) => {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobileViewport()) return;
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobileViewport()) return;
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX < SWIPE_MIN_PX || absX < absY * SWIPE_HORIZONTAL_RATIO) return;
      if (dx < 0) onPrevPodcast();
      else onNextPodcast();
    },
    [onPrevPodcast, onNextPodcast],
  );

  const onTouchCancel = useCallback(() => {
    touchStartRef.current = null;
  }, []);

  const transcriptBlocks = useMemo(() => {
    const plain = transcriptToPlainText(currentPodcast.transcript).trim();
    if (plain.length === 0) return transcriptToBlocks(DEFAULT_TRANSCRIPT);
    return transcriptToBlocks(currentPodcast.transcript);
  }, [currentPodcast.transcript]);

  const aboutBody = episodeBodyText(currentPodcast);

  const p5Props = useMemo(
    () => ({
      get analyser(): AnalyserNode | null {
        return analyserRef.current;
      },
      get simulatedLevel(): number {
        return simulatedLevelRef.current;
      },
      isConnected,
      isPlaying,
      currentTime,
      outputLatency,
      playbackOrderIndex,
    }),
    [
      isConnected,
      isPlaying,
      currentTime,
      outputLatency,
      playbackOrderIndex,
      analyserRef,
      simulatedLevelRef,
    ],
  );

  const idleTitleProps = useMemo(
    () => ({ isPlayButtonHovered }),
    [isPlayButtonHovered],
  );

  const aboutHeading = (
    <p className="font-spline-sans text-[9px] md:text-[12px] font-bold uppercase tracking-[0.14em] text-black ">
      ABOUT
    </p>
  );

  const aboutParagraph = (
    <p className="font-spline-sans text-[11px] md:text-[14px] leading-snug text-black">
      {aboutBody}
    </p>
  );

  /**
   * Mobile sketch band. Its height must stay identical to the transcript panel's `top-[...]`
   * offset below, so the two meet exactly with no white gap between them.
   */
  const sketchShellClass =
    "relative flex w-full shrink-0 items-center justify-center overflow-hidden md:h-full md:min-h-0 " +
    (hasUserPlayedAudio
      ? "h-[calc(max(min(32vh,200px),140px)+24px)] md:w-3/4 md:shrink-0"
      : "min-h-[min(42vh,250px)] flex-1 md:w-full md:flex-1");

  return (
    <div
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      {/* Left: p5 — full width until first play; after play, ~3/4 + transcript column */}
      <div className={sketchShellClass}>
        {hasUserPlayedAudio ? (
          <P5Canvas
            sketch={audioReactiveSketch}
            props={p5Props}
            className="h-full w-full"
          />
        ) : (
          <P5Canvas
            sketch={algoTitleSketch}
            props={idleTitleProps}
            className="h-full w-full"
          />
        )}
      </div>

      {/* Prev / Next: floating on all breakpoints (mobile + desktop) */}
      <PrevButton
        onClick={onPrevPodcast}
        className="absolute left-2 top-1/2 z-30 -translate-y-1/2 md:left-3"
      />
      <NextButton
        onClick={onNextPodcast}
        className="absolute right-2 top-1/2 z-30 -translate-y-1/2 md:right-5"
      />

      {/* 데스크톱: transcript가 absolute일 때만 flex 균형용 스페이서 */}
      {hasUserPlayedAudio && (
        <div
          className="hidden min-h-0 md:block md:h-full md:min-w-0 md:flex-1"
          aria-hidden
        />
      )}

      {/* Transcript + about: only after first play (idle title uses full width).
          Mobile top offset = sketch band height in `sketchShellClass` (keep both in sync). */}
      {hasUserPlayedAudio && (
        <div className="transcript-panel absolute bottom-0 left-0 right-0 top-[calc(max(min(32vh,200px),140px)+24px)] z-10 min-h-0 border-t-[3px] border-black bg-transparent text-left md:left-auto md:top-0 md:w-1/2 md:border-t-0">
          <div className="transcript-panel-inner px-20 pb-6 pt-[16px] md:px-8 md:py-10 md:pr-10 lg:px-12 lg:pr-14">
            <div className="md:grid md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] md:gap-x-[40px] lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
              <aside className="mb-8 hidden text-left md:mb-0 md:block md:pt-1">
                <h2 className="mb-[22px] font-spline-sans-mono text-[22px] font-bold text-black lg:text-[36px]">
                  Transcript
                </h2>
                {aboutHeading}
                {aboutParagraph}
              </aside>

              <div className="min-w-0 md:pt-1">
                <div className="mb-8 md:hidden">
                  {aboutHeading}
                  {aboutParagraph}
                </div>
                <h2 className="mb-1 font-spline-sans-mono text-[36px] font-bold text-black md:mb-0 md:hidden">
                  Transcript
                </h2>
                <TranscriptBlocks blocks={transcriptBlocks} />
                {/* Next episode: always visible under the transcript; wraps to the first episode on the last one. */}
                {nextPodcast && (
                  <section
                    className="mt-12 pt-8 text-left md:mt-16 md:pt-10"
                    aria-label="Next podcast"
                  >
                    <p className="font-spline-sans-mono text-[12px] font-bold leading-tight text-black md:text-[24px]">
                      {nextPodcast.title}
                    </p>
                    <p className="mt-6 font-spline-sans text-[12px] font-normal leading-relaxed text-black md:text-[24px]">
                      {nextPodcast.summary}
                    </p>
                    <button
                      type="button"
                      onClick={onPlayNext}
                      className="mt-6 w-fit cursor-pointer p-0 text-left font-spline-sans text-[12px] font-bold text-black underline md:text-[24px]"
                    >
                      Play
                    </button>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastMainContent;
