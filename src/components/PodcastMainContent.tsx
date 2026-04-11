import React, { useCallback, useMemo, useRef } from "react";

import NextButton from "./NextButton";
import P5Canvas from "./P5Canvas";
import { episodeBodyText } from "../data/episodes";
import type { Episode } from "../schemas/episode";
import { transcriptToBlocks, transcriptToPlainText } from "../lib/transcript";
import PrevButton from "./PrevButton";
import { audioReactiveSketch } from "../sketches/audioReactiveSketch";

interface PodcastMainContentProps {
  currentPodcast: Episode;
  nextPodcast: Episode | null;
  showNextPrompt?: boolean;
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
              <p className="w-[6.75rem] shrink-0 pt-0.5 font-spline-sans text-[10px] font-bold uppercase leading-tight tracking-wide text-black md:w-32 md:text-[11px]">
                {block.speaker}
              </p>
              <p className="min-w-0 flex-1 text-left font-spline-sans text-[18px] text-black md:text-base">
                {block.text}
              </p>
            </>
          ) : (
            <p className="text-left font-spline-sans text-[18px] text-black md:text-base">
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
  showNextPrompt = false,
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

  const aboutHeading = (
    <p className="font-spline-sans text-[9px] md:text-[12px] font-bold uppercase tracking-[0.14em] text-black ">
      ABOUT
    </p>
  );

  const aboutParagraph = (
    <p className="font-spline-sans text-[14px] leading-snug text-black">
      {aboutBody}
    </p>
  );

  const nextPromptOpen = Boolean(nextPodcast && showNextPrompt);

  return (
    <div
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      {/* Left: p5 only (desktop ~50%; mobile white band per mock) */}
      <div className="relative flex h-[min(42vh,250px)] min-h-[160px] w-full shrink-0 items-center justify-center overflow-hidden border-b-[3px] border-black md:h-full md:min-h-0 md:w-3/4 md:shrink-0 md:border-b-0 md:border-black">
        <P5Canvas
          sketch={audioReactiveSketch}
          props={p5Props}
          className="h-full w-full"
        />
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

      {/* 데스크톱: absolute로 화면(메인) 오른쪽 절반 — flex에서 빠지므로 남는 폭용 스페이서 필요 */}
      <div
        className="hidden min-h-0 md:block md:h-full md:min-w-0 md:flex-1"
        aria-hidden
      />

      {/* 모바일: 스케치 아래 flex-1 / md: 오른쪽 50% absolute */}
      <div className="transcript-panel relative z-10 min-h-0 h-full w-full flex-1 bg-transparent text-left md:absolute md:inset-y-0 md:w-1/2 md:right-0 md:flex-none">
        {!nextPromptOpen && (
          <div className="transcript-panel-inner px-12 pb-6 pt-[16px] md:px-8 md:py-10 md:pr-10 lg:px-12 lg:pr-14">
            <div className="md:grid md:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] md:gap-x-[40px] lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
              <aside className="mb-8 hidden text-left md:mb-0 md:block md:pt-1">
                <h2 className="mb-[22px] font-spline-sans-mono text-[36px] font-bold text-black md:text-4xl lg:text-[2.75rem]">
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
              </div>
            </div>
          </div>
        )}

        {nextPromptOpen && nextPodcast && (
          <div
            tabIndex={-1}
            className="transcript-panel-inner text-left flex h-full justify-center min-h-0 w-full flex-col gap-6 px-15 outline-none md:gap-8 md:py-10 md:px-25"
            aria-label="Next podcast"
          >
            <p className="font-spline-sans-mono text-2xl font-bold leading-tight text-black md:text-3xl">
              {nextPodcast.title}
            </p>
            <p className="font-spline-sans text-[18px] font-normal leading-relaxed text-black md:text-base">
              {nextPodcast.summary}
            </p>
            <button
              type="button"
              onClick={onPlayNext}
              className="text-left w-fit cursor-pointer p-0 font-spline-sans-mono text-lg font-bold text-black underline md:text-xl"
            >
              Play
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PodcastMainContent;
