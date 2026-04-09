import {
  formatDuration,
  usePodcastDurations,
} from "../hooks/usePodcastDurations";

import type { Episode } from "../schemas/episode";
import React from "react";

interface PlaylistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  podcasts: Episode[];
  currentPodcastIndex: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelectPodcast: (index: number) => void;
}

const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
  isOpen,
  onClose,
  podcasts,
  currentPodcastIndex,
  isPlaying,
  onTogglePlay,
  onSelectPodcast,
}) => {
  const durations = usePodcastDurations(podcasts);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-30 transition-opacity duration-300 md:bg-transparent ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed top-0 left-0 z-40 flex h-full w-full flex-col overflow-x-hidden
          md:w-[50%]
          bg-[#5CD1E0] border-b-[5px] border-black
          shadow-[4px_0_4px_0_rgba(0,0,0,0.25)] backdrop-blur-[2px]
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"}`}
        aria-label="Playlist"
        aria-hidden={!isOpen}
      >
        <div className="relative flex flex-shrink-0 items-center justify-between px-4 pb-3 pt-4 md:px-6 h-[160px] border-b-[5px] border-black">
          <h2 className="min-w-0 shrink font-spline-sans-mono text-[48px] not-italic font-medium  tracking-[-2.4px] text-black md:text-[110px] md:tracking-[-5.5px]">
            Playlist
          </h2>
          <button
            onClick={onClose}
            className="absolute right-5 top-[50%] -translate-y-1/2 md:right-4 md:top-8 w-[32.5px] h-[32.5px] min-w-[32.5px] min-h-[32.5px] flex items-center justify-center text-black rounded-full transition-colors cursor-pointer"
            aria-label="Close playlist"
          >
            <svg
              className="w-[32.5px] h-[32.5px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="playlist-sidebar-scroll flex-1 overflow-y-auto text-left">
          <div className="flex flex-col my-6 mx-4 sm:my-[54px] sm:mx-[30px] sm:items-start">
            <div className="flex items-center justify-between w-full">
              <h3 className="mt-1 font-spline-sans text-[22px] not-italic font-semibold text-black md:mt-0 md:text-[48px] md:tracking-[-0.96px]">
                Everyday Algorithms
              </h3>
              <div className="my-auto flex-shrink-0 px-2.5 py-1 rounded-full bg-black text-white text-sm sm:text-[22px] font-spline-sans font-bold h-fit self-start">
                2024
              </div>
            </div>
            <p className="mt-2 font-spline-sans text-[14px] not-italic font-normal leading-[18px] text-black md:text-[28px] md:leading-[36px] md:tracking-[-0.56px]">
              Master of Media Design students investigate algorithms embedded in
              our everyday lives.
            </p>
          </div>
          <ul className="px-4 md:px-6 pb-6">
            {podcasts.map((podcast, index) => (
              <li
                key={podcast.slug}
                className="py-2 sm:py-3 md:py-4 first:pt-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (index === currentPodcastIndex) {
                      onTogglePlay();
                    } else {
                      onSelectPodcast(index);
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center gap-2 sm:gap-3 text-left transition-colors rounded cursor-pointer`}
                >
                  {index === currentPodcastIndex && isPlaying ? (
                    <svg
                      className="w-9 h-9 sm:w-10 sm:h-10 md:w-[48px] md:h-[48px] flex-shrink-0"
                      viewBox="0 0 48 48"
                      fill="currentColor"
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r="22.6364"
                        fill="white"
                        stroke="black"
                        strokeWidth="2.72727"
                      />
                      <rect x="16" y="14" width="6" height="20" fill="black" />
                      <rect x="26" y="14" width="6" height="20" fill="black" />
                    </svg>
                  ) : (
                    <svg
                      className="w-9 h-9 sm:w-10 sm:h-10 md:w-[48px] md:h-[48px] flex-shrink-0"
                      viewBox="0 0 48 48"
                      fill="currentColor"
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r="22.6364"
                        fill="white"
                        stroke="black"
                        strokeWidth="2.72727"
                      />
                      <path
                        d="M36 24L18.8182 33.9199L18.8182 14.08L36 24Z"
                        fill="black"
                      />
                    </svg>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-spline-sans-mono text-[14px] not-italic font-semibold leading-[16px] text-black md:text-[28px] md:font-medium md:leading-[32px] max-w-[230px] line-clamp-2 md:max-w-[520px]">
                      {podcast.title}
                    </p>
                    <p className="mt-0.5 font-spline-sans-mono text-[11px] not-italic font-normal leading-[16px] text-black md:text-[22px] md:leading-[32px]">
                      by {podcast.authorName ?? "Unknown"}
                    </p>
                  </div>
                  <span className="flex-shrink-0 font-spline-sans-mono text-xs sm:text-base md:text-[22px] leading-[24px] text-black tabular-nums">
                    {formatDuration(durations[podcast.slug] ?? NaN)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
};

export default PlaylistSidebar;
