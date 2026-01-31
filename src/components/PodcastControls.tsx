import { Podcast } from "../types/podcast";
import React from "react";

interface PodcastControlsProps {
  podcast: Podcast;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onListClick?: () => void;
  onSeek?: (time: number) => void;
}

const PodcastControls: React.FC<PodcastControlsProps> = ({
  podcast,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onListClick,
  onSeek,
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
      className={`flex items-start justify-between px-4 md:px-6 ${
        isOverlay ? "text-white" : "text-black"
      }`}
    >
      {/* Left: Title & Author */}
      <div className="flex-shrink-0 p-2 md:p-[16px] text-left">
        <h4 className="font-spline-sans-mono text-[20px] md:text-[42px] font-medium leading-[24px] md:leading-[38px] tracking-[-0.6px] md:tracking-[-1.26px]">
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

      {/* Right: Controls on the line */}
      <div className="flex flex-col items-end absolute right-4 md:right-6 -top-[120px] md:top-0 md:-translate-y-1/2 z-10">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-[17px]">
          {/* List Button */}
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

          {/* Play/Pause Button */}
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
      </div>
    </div>
  );
};

export default PodcastControls;
