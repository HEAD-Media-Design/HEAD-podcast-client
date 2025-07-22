import { Podcast } from "../types/podcast";
import React from "react";

interface PodcastControlsProps {
  podcast: Podcast;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
}

const PodcastControls: React.FC<PodcastControlsProps> = ({
  podcast,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
}) => {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="border-t border-black p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-medium text-black mb-1">
            {podcast.title}
          </h4>
          <p className="text-sm text-gray-600">
            by {podcast.author?.name || "Unknown"}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Progress Bar */}
          <div className="flex-1 max-w-xs">
            <div className="w-full h-1 bg-gray-300 rounded-full overflow-hidden">
              <div
                className="h-1 bg-black rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button className="w-8 h-8 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
              </svg>
            </button>

            <button
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-full border border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
            >
              {isPlaying ? (
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 ml-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Time */}
          <span className="text-sm text-black min-w-[3rem]">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PodcastControls;
