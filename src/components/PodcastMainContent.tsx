import React from "react";

interface PodcastMainContentProps {
  onPrevPodcast: () => void;
  onNextPodcast: () => void;
}

const PodcastMainContent: React.FC<PodcastMainContentProps> = ({
  onPrevPodcast,
  onNextPodcast,
}) => {
  return (
    <div className="flex-1 relative flex items-center justify-center p-6 pb-[120px] md:pb-6 h-full">
      {/* Previous Button - Floating Left */}
      <button
        onClick={onPrevPodcast}
        className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors cursor-pointer z-10 md:w-[52px] md:h-[52px] w-[26px] h-[26px]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="56"
          height="52"
          viewBox="0 0 56 52"
          fill="none"
        >
          <line x1="5" y1="48" x2="5" y2="4" stroke="black" strokeWidth="10" />
          <path d="M4 26L43 3.48333L43 48.5167L4 26Z" fill="black" />
        </svg>
      </button>

      {/* Main Title */}
      <div className="text-center">
        <h1 className="text-[220px] font-spline-sans font-bold leading-[190px] tracking-[-8.8px]">
          VOICES OF STUDENTS
          {/* creative coding part */}
        </h1>
      </div>

      {/* Next Button - Floating Right */}
      <button
        onClick={onNextPodcast}
        className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors cursor-pointer z-10 md:w-[52px] md:h-[52px] w-[26px] h-[26px]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="56"
          height="52"
          viewBox="0 0 56 52"
          fill="none"
        >
          <line
            x1="51"
            y1="4.00002"
            x2="51"
            y2="48"
            stroke="black"
            strokeWidth="10"
          />
          <path d="M52 26L13 48.5167L13 3.48335L52 26Z" fill="black" />
        </svg>
      </button>
    </div>
  );
};

export default PodcastMainContent;
