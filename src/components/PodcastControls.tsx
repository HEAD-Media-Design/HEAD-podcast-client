import { Podcast } from "../types/podcast";
import React from "react";

export interface PodcastControlButtonsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onListClick?: () => void;
}

/** List + Play buttons only; used fixed in layout so they don’t animate with the bar */
export const PodcastControlButtons: React.FC<PodcastControlButtonsProps> = ({
  isPlaying,
  onTogglePlay,
  onListClick,
}) => (
  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-[17px]">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onListClick?.();
      }}
      className="w-[48px] h-[48px] md:w-[88px] md:h-[88px] rounded-full border-[3px] md:border-5 border-black bg-white flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer"
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
      className="w-[48px] h-[48px] md:w-[88px] md:h-[88px] rounded-full border-[3px] md:border-5 border-black bg-white flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer"
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
          className="w-4 h-5 md:w-8 md:h-9 pl-0.5 md:pl-1"
          viewBox="0 0 32 37"
          fill="currentColor"
        >
          <path d="M31.5 18.1865L-1.7129e-06 36.3731L-1.22981e-07 -1.09137e-05L31.5 18.1865Z" />
        </svg>
      )}
    </button>
  </div>
);

interface PodcastControlsProps {
  podcast: Podcast;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onListClick?: () => void;
  onSeek?: (time: number) => void;
  audioError?: string | null;
  onDismissAudioError?: () => void;
  /** When true, buttons are not rendered here (use PodcastControlButtons in a fixed layer) */
  renderButtonsSeparately?: boolean;
}

const PodcastControls: React.FC<PodcastControlsProps> = ({
  podcast,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onListClick,
  onSeek,
  audioError,
  onDismissAudioError,
  renderButtonsSeparately = false,
}) => {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

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

  const ContentLayer = ({ isOverlay = false }: { isOverlay?: boolean }) => (
    <div
      className={`flex items-start justify-between pl-2 pr-4 md:px-6 ${
        isOverlay ? "text-white" : "text-black"
      }`}
    >
      {/* Left: Title & Author – min-w-0 so title can shrink; line-clamp on mobile to avoid cutoff */}
      <div className="min-w-0 flex-1 pl-1 pr-2 pt-2 pb-2 md:p-[16px] md:flex-initial text-left">
        <h4 className="font-spline-sans-mono text-[20px] md:text-[42px] font-medium leading-[24px] md:leading-[38px] tracking-[-0.6px] md:tracking-[-1.26px] line-clamp-2 md:line-clamp-none">
          {podcast.title}
        </h4>
        <p
          className={`font-spline-sans-mono text-[14px] md:text-[24px] leading-[20px] md:leading-[38px] tracking-[-0.42px] md:tracking-[-0.72px] ${
            isOverlay ? "text-white" : "text-black"
          }`}
        >
          by {podcast.author?.name || "Unknown"}
        </p>
      </div>

      {/* Time: currentTime on black (overlay), duration on white (base) */}
      <span className="font-spline-sans-mono text-[14px] md:text-[24px] leading-[20px] md:leading-[38px] tracking-[-0.28px] md:tracking-[-0.48px] absolute right-4 md:right-6 bottom-2 md:bottom-4">
        {isOverlay ? formatTime(currentTime) : formatTime(duration)}
      </span>
    </div>
  );

  return (
    <div className="relative">
      {audioError && (
        <div
          className="bg-red-100 text-red-800 px-4 py-2 text-sm flex items-center justify-between gap-2"
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
        className="relative border-t border-black border-t-[3px] md:border-t-[5px] cursor-pointer"
        onClick={handleProgressClick}
        role="progressbar"
        aria-valuenow={duration > 0 ? currentTime : 0}
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-label="Audio progress"
      >
        {/* Base Layer: White background, black text */}
        <div className="relative bg-white">
          <ContentLayer />
        </div>

        {/* Progress Layer: Black background, white text */}
        <div
          className="absolute top-0 left-0 h-full bg-black transition-all duration-300 overflow-hidden"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="w-screen">
            <ContentLayer isOverlay />
          </div>
        </div>

        {/* Right: buttons or spacer when buttons are rendered in a fixed layer */}
        {renderButtonsSeparately ? (
          <div
            className="absolute right-4 md:right-6 top-0 w-[48px] md:w-[193px] h-[120px] md:h-full pointer-events-none"
            aria-hidden
          />
        ) : (
          <div className="flex flex-col items-end absolute right-4 md:right-6 -top-[120px] md:top-0 md:-translate-y-1/2 z-10">
            <PodcastControlButtons
              isPlaying={isPlaying}
              onTogglePlay={onTogglePlay}
              onListClick={onListClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PodcastControls;
