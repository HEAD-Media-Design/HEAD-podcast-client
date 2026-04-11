import type { Episode } from "../schemas/episode";
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export interface PodcastControlButtonsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onListClick?: () => void;
  /** For idle title p5 sketch hover parity with original “listen” button. */
  onPlayButtonHoverChange?: (hovered: boolean) => void;
}

/** List + Play buttons only; used fixed in layout so they don’t animate with the bar */
export const PodcastControlButtons: React.FC<PodcastControlButtonsProps> = ({
  isPlaying,
  onTogglePlay,
  onListClick,
  onPlayButtonHoverChange,
}) => (
  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-[17px]">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onListClick?.();
      }}
      className="flex h-[48px] w-[48px] cursor-pointer items-center justify-center rounded-full border-[3px] border-black bg-white md:h-[88px] md:w-[88px] md:border-5 hover:bg-black hover:text-white transition-colors"
      aria-label="Open playlist"
    >
      <svg
        className="w-4 h-4 md:w-8 md:h-7"
        viewBox="0 0 32 28"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="3" cy="4" r="3" />
        <rect x="10" y="1" width="22" height="6" />
        <circle cx="3" cy="14" r="3" />
        <rect x="10" y="11" width="22" height="6" />
        <circle cx="3" cy="24" r="3" />
        <rect x="10" y="21" width="22" height="6" />
      </svg>
    </button>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onTogglePlay();
      }}
      onPointerEnter={() => onPlayButtonHoverChange?.(true)}
      onPointerLeave={() => onPlayButtonHoverChange?.(false)}
      className="flex h-[48px] w-[48px] cursor-pointer items-center justify-center rounded-full border-[3px] border-black bg-white md:h-[88px] md:w-[88px] md:border-5 hover:bg-black hover:text-white transition-colors"
    >
      {isPlaying ? (
        <svg
          className="w-3 h-4 md:w-6 md:h-8"
          viewBox="0 0 24 32"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="0" y="0" width="8" height="32" />
          <rect x="16" y="0" width="8" height="32" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-5 pl-0.5 md:w-8 md:h-9 md:pl-1"
          viewBox="0 0 32 37"
          fill="currentColor"
        >
          <path d="M31.5 18.1865L-1.7129e-06 36.3731L-1.22981e-07 -1.09137e-05L31.5 18.1865Z" />
        </svg>
      )}
    </button>
  </div>
);

const MOBILE_TITLE_CLASS =
  "font-spline-sans-mono text-[24px] not-italic font-medium tracking-[-0.96px] text-inherit";

const MARQUEE_GAP_PX = 32;

type MarqueeLayoutInfo = { overflow: boolean; distancePx: number };

/**
 * Mobile-only. Base variant measures overflow and reports layout; overlay mirrors parent state.
 * Marquee motion is applied via transform from a single rAF loop in the parent (both layers stay in sync).
 */
const MobileMarqueeTitle = memo(function MobileMarqueeTitle({
  title,
  playbackEnded,
  variant,
  marqueeOverflow,
  showMarqueeTrack,
  onMarqueeLayout,
  assignTrackRef,
}: {
  title: string;
  playbackEnded: boolean;
  variant: "base" | "overlay";
  marqueeOverflow: boolean;
  showMarqueeTrack: boolean;
  onMarqueeLayout?: (info: MarqueeLayoutInfo) => void;
  assignTrackRef?: (el: HTMLDivElement | null) => void;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (variant !== "base" || !onMarqueeLayout) return;
    const outer = outerRef.current;
    const measure = measureRef.current;
    if (!outer || !measure) return;

    const update = () => {
      const textW = measure.offsetWidth;
      const avail = outer.clientWidth;
      const overflow = textW > avail + 1;
      const distancePx = overflow ? textW + MARQUEE_GAP_PX : 0;
      onMarqueeLayout({ overflow, distancePx });
    };

    update();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(update);
    });
    ro.observe(outer);
    return () => ro.disconnect();
  }, [title, variant, onMarqueeLayout]);

  if (variant === "overlay" && !marqueeOverflow) {
    return (
      <div className="relative min-h-[19px] min-w-0 overflow-hidden contain-[layout]">
        <span className={`block min-w-0 ${MOBILE_TITLE_CLASS}`}>
          <span className="block whitespace-nowrap">{title}</span>
        </span>
      </div>
    );
  }

  if (variant === "base") {
    return (
      <div
        ref={outerRef}
        className="relative min-h-[19px] min-w-0 overflow-hidden contain-[layout]"
      >
        <span
          ref={measureRef}
          className={`pointer-events-none absolute left-0 top-0 z-0 whitespace-nowrap opacity-0 ${MOBILE_TITLE_CLASS}`}
          aria-hidden
        >
          {title}
        </span>

        {!marqueeOverflow && (
          <span className={`relative ${MOBILE_TITLE_CLASS}`}>{title}</span>
        )}

        {marqueeOverflow && playbackEnded && (
          <span
            className={`relative block overflow-hidden whitespace-nowrap ${MOBILE_TITLE_CLASS}`}
          >
            {title}
          </span>
        )}

        {marqueeOverflow && showMarqueeTrack && (
          <>
            <span className="sr-only">{title}</span>
            <div
              ref={assignTrackRef}
              className={`podcast-controls-title-marquee-row relative [transform:translateZ(0)] ${MOBILE_TITLE_CLASS}`}
              aria-hidden
            >
              <span className="shrink-0 pr-8">{title}</span>
              <span className="shrink-0 pr-8">{title}</span>
            </div>
          </>
        )}
      </div>
    );
  }

  /* overlay + marqueeOverflow */
  return (
    <div className="relative min-h-[19px] min-w-0 overflow-hidden contain-[layout]">
      {playbackEnded || !showMarqueeTrack ? (
        <span
          className={`relative block overflow-hidden whitespace-nowrap ${MOBILE_TITLE_CLASS}`}
        >
          {title}
        </span>
      ) : (
        <>
          <span className="sr-only">{title}</span>
          <div
            ref={assignTrackRef}
            className={`podcast-controls-title-marquee-row relative [transform:translateZ(0)] ${MOBILE_TITLE_CLASS}`}
            aria-hidden
          >
            <span className="shrink-0 pr-8">{title}</span>
            <span className="shrink-0 pr-8">{title}</span>
          </div>
        </>
      )}
    </div>
  );
});

type PodcastControlsContentLayerProps = {
  podcast: Episode;
  isOverlay: boolean;
  playbackEnded: boolean;
  marqueeOverflow: boolean;
  showMarqueeTrack: boolean;
  onMarqueeLayout: (info: MarqueeLayoutInfo) => void;
  registerBaseTrack: (el: HTMLDivElement | null) => void;
  registerOverlayTrack: (el: HTMLDivElement | null) => void;
  /** Shown beside author on small screens; desktop uses the floating chip on the bar. */
  mobileInlineTime: string;
};

type PodcastControlsContentLayerSharedProps = Omit<
  PodcastControlsContentLayerProps,
  "isOverlay"
>;

/** Stable component type so `currentTime` updates don’t remount the whole layer (fixes marquee jitter). */
function PodcastControlsContentLayer({
  podcast,
  isOverlay,
  playbackEnded,
  marqueeOverflow,
  showMarqueeTrack,
  onMarqueeLayout,
  registerBaseTrack,
  registerOverlayTrack,
  mobileInlineTime,
}: PodcastControlsContentLayerProps) {
  return (
    <div
      className={`flex items-start justify-between md:px-6 max-md:pl-[max(16px,env(safe-area-inset-left,0px))] max-md:pr-[max(16px,env(safe-area-inset-right,0px))] max-md:pb-2.5 ${
        isOverlay ? "text-white" : "text-black"
      }`}
    >
      <div className="min-w-0 flex-1 p-2 text-left md:flex-initial md:p-[16px]">
        <h4 className="m-0 p-0">
          <div className="md:hidden">
            <MobileMarqueeTitle
              title={podcast.title}
              playbackEnded={playbackEnded}
              variant={isOverlay ? "overlay" : "base"}
              marqueeOverflow={marqueeOverflow}
              showMarqueeTrack={showMarqueeTrack}
              onMarqueeLayout={isOverlay ? undefined : onMarqueeLayout}
              assignTrackRef={
                isOverlay ? registerOverlayTrack : registerBaseTrack
              }
            />
          </div>
          <span className="hidden font-spline-sans-mono text-[42px] not-italic font-medium leading-[38px] tracking-[-1.26px] md:inline">
            {podcast.title}
          </span>
        </h4>
        <div className="flex items-baseline justify-between gap-2 md:block">
          <p
            className={`min-w-0 flex-1 font-spline-sans-mono text-[12px] not-italic font-normal leading-[19px] tracking-[-0.24px] md:flex-none md:text-[24px] md:leading-[38px] md:tracking-[-0.72px] ${
              isOverlay ? "text-white" : "text-black"
            }`}
          >
            by {podcast.authorName ?? "Unknown"}
          </p>
          <span
            className="pointer-events-none shrink-0 md:hidden inline-flex max-w-[45%] items-center justify-end rounded-sm bg-white/90 px-1.5 py-0.5 text-right tabular-nums font-spline-sans-mono text-[12px] leading-[19px] tracking-[-0.24px] text-black backdrop-blur-sm"
            aria-live="polite"
            aria-atomic="true"
          >
            {mobileInlineTime}
          </span>
        </div>
      </div>
    </div>
  );
}

interface PodcastControlsProps {
  podcast: Episode;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  /** True after the episode has finished (audio `ended`); stops mobile title marquee. */
  playbackEnded?: boolean;
  onTogglePlay: () => void;
  onListClick?: () => void;
  onSeek?: (time: number) => void;
  audioError?: string | null;
  onDismissAudioError?: () => void;
  /** When true, buttons are not rendered here (use PodcastControlButtons in a fixed layer) */
  renderButtonsSeparately?: boolean;
  onPlayButtonHoverChange?: (hovered: boolean) => void;
}

const MARQUEE_SPEED_PX_PER_SEC = 28;

const PodcastControls: React.FC<PodcastControlsProps> = ({
  podcast,
  isPlaying,
  currentTime,
  duration,
  playbackEnded = false,
  onTogglePlay,
  onListClick,
  onSeek,
  audioError,
  onDismissAudioError,
  renderButtonsSeparately = false,
  onPlayButtonHoverChange,
}) => {
  const [marqueeOverflow, setMarqueeOverflow] = useState(false);
  const [marqueeDistancePx, setMarqueeDistancePx] = useState(0);
  const trackElsRef = useRef<{
    base: HTMLDivElement | null;
    overlay: HTMLDivElement | null;
  }>({ base: null, overlay: null });
  const marqueeOffsetRef = useRef(0);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMarqueeLayout = useCallback((info: MarqueeLayoutInfo) => {
    setMarqueeOverflow(info.overflow);
    setMarqueeDistancePx(info.distancePx);
  }, []);

  const registerBaseTrack = useCallback((el: HTMLDivElement | null) => {
    trackElsRef.current.base = el;
  }, []);

  const registerOverlayTrack = useCallback((el: HTMLDivElement | null) => {
    trackElsRef.current.overlay = el;
  }, []);

  const showMarqueeTrack = marqueeOverflow && !playbackEnded;

  useEffect(() => {
    setMarqueeOverflow(false);
    setMarqueeDistancePx(0);
    marqueeOffsetRef.current = 0;
  }, [podcast.slug]);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const clearTransforms = () => {
      trackElsRef.current.base?.style.removeProperty("transform");
      trackElsRef.current.overlay?.style.removeProperty("transform");
    };

    if (reduceMotion || !showMarqueeTrack || marqueeDistancePx <= 0) {
      clearTransforms();
      return;
    }

    let raf = 0;
    let last = performance.now();
    marqueeOffsetRef.current = marqueeOffsetRef.current % marqueeDistancePx;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const dist = marqueeDistancePx;
      marqueeOffsetRef.current =
        (marqueeOffsetRef.current + MARQUEE_SPEED_PX_PER_SEC * dt) % dist;
      const tx = -marqueeOffsetRef.current;
      const b = trackElsRef.current.base;
      const o = trackElsRef.current.overlay;
      if (b) b.style.transform = `translate3d(${tx}px,0,0)`;
      if (o) o.style.transform = `translate3d(${tx}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTransforms();
    };
  }, [showMarqueeTrack, marqueeDistancePx, podcast.title]);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || duration <= 0) return;
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;
    onSeek(time);
  };

  const timeLabel = `${formatTime(currentTime)}/${formatTime(duration)}`;

  const layerProps: PodcastControlsContentLayerSharedProps = {
    podcast,
    playbackEnded,
    marqueeOverflow,
    showMarqueeTrack,
    onMarqueeLayout: handleMarqueeLayout,
    registerBaseTrack,
    registerOverlayTrack,
    mobileInlineTime: timeLabel,
  };

  return (
    <div className="relative">
      {audioError && (
        <div
          className="flex items-center justify-between gap-2 bg-red-100 px-4 py-2 text-sm text-red-800"
          role="alert"
        >
          <span>{audioError}</span>
          {onDismissAudioError && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismissAudioError();
              }}
              className="shrink-0 underline hover:no-underline"
              aria-label="Dismiss"
            >
              Dismiss
            </button>
          )}
        </div>
      )}
      <div
        className="relative cursor-pointer border-t border-black border-t-[3px] md:border-t-[5px]"
        onClick={handleProgressClick}
        role="progressbar"
        aria-valuenow={duration > 0 ? currentTime : 0}
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-label="Audio progress"
      >
        <div className="relative bg-white">
          <PodcastControlsContentLayer {...layerProps} isOverlay={false} />
        </div>

        <div
          className="absolute top-0 left-0 h-full overflow-hidden bg-black transition-[width] duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="w-screen">
            <PodcastControlsContentLayer {...layerProps} isOverlay />
          </div>
        </div>

        <span
          className="pointer-events-none absolute bottom-4 right-6 z-20 hidden max-w-[calc(100%-2rem)] items-center justify-end rounded-md bg-white/90 px-2 py-1 text-right tabular-nums font-spline-sans-mono text-[24px] leading-[38px] tracking-[-0.48px] text-black backdrop-blur-sm md:inline-flex"
          aria-live="polite"
          aria-atomic="true"
        >
          {timeLabel}
        </span>

        {renderButtonsSeparately ? (
          <div
            className="pointer-events-none absolute top-0 right-4 h-[120px] w-[48px] md:right-6 md:h-full md:w-[193px]"
            aria-hidden
          />
        ) : (
          <div className="absolute -top-[120px] right-4 z-10 flex flex-col items-end md:top-0 md:right-6 md:-translate-y-1/2">
            <PodcastControlButtons
              isPlaying={isPlaying}
              onTogglePlay={onTogglePlay}
              onListClick={onListClick}
              onPlayButtonHoverChange={onPlayButtonHoverChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PodcastControls;
