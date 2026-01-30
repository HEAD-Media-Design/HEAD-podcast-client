import {
  formatDuration,
  usePodcastDurations,
} from "../hooks/usePodcastDurations";

import { Podcast } from "../types/podcast";
import React from "react";

interface PlaylistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  podcasts: Podcast[];
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
        className={`fixed top-0 left-0 h-full z-40 flex flex-col
          w-full md:w-[50%]
          bg-[#5CD1E0] border-b-[5px] border-black
          shadow-[4px_0_4px_0_rgba(0,0,0,0.25)] backdrop-blur-[2px]
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        aria-label="Playlist"
      >
        <div className="flex items-center justify-between px-4 md:px-6 pt-4 pb-3 flex-shrink-0 relative">
          <h2 className="font-spline-sans-mono text-[48px] md:text-[120px] tracking-tight text-black leading-[65px] md:leading-[120px]">
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
        <div className="border-b-[5px] border-black flex-shrink-0" />

        <div className="playlist-sidebar-scroll flex-1 overflow-y-auto text-left">
          <div className="flex sm:flex-row my-6 mx-4 sm:my-[54px] sm:mx-[32px] gap-2 sm:items-start">
            <div className="min-w-0 flex-1">
              <h3 className="font-spline-sans text-2xl sm:text-[48px] leading-tight tracking-[-0.96px] font-bold text-black">
                Supernova
              </h3>
              <h3 className="font-spline-sans text-2xl sm:text-[48px] leading-tight sm:leading-[1.2] tracking-[-0.96px] text-black mt-1 sm:mt-0">
                Algorithms Beyond Us
              </h3>
              <p className="font-spline-sans text-base sm:text-[28px] leading-snug sm:leading-[36px] tracking-[-0.56px] mt-4 sm:mt-6">
                Master of Media Design students investigate algorithms embedded
                in our everyday lives.
              </p>
            </div>
            <div className="flex-shrink-0 px-2.5 py-1 rounded-full bg-black text-white text-sm sm:text-[22px] font-spline-sans font-bold h-fit self-start">
              2024
            </div>
          </div>
          <ul className="px-4 md:px-6 pb-6">
            {podcasts.map((podcast, index) => (
              <li key={podcast.id} className="py-2 sm:py-3 md:py-4 first:pt-0">
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
                    <p className="font-spline-sans-mono font-bold text-base sm:text-xl md:text-[28px] leading-tight sm:leading-[24px] text-black">
                      {podcast.title}
                    </p>
                    <p className="font-spline-sans text-base md:text-[22px] leading-tight sm:leading-[24px] text-black mt-0.5">
                      by {podcast.author?.name ?? "Unknown"}
                    </p>
                  </div>
                  <span className="flex-shrink-0 font-spline-sans-mono text-xs sm:text-base md:text-[22px] leading-[24px] text-black tabular-nums">
                    {formatDuration(durations[podcast.id] ?? NaN)}
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
