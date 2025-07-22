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
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="flex items-center space-x-8 max-w-4xl w-full">
        {/* Previous Button */}
        <button
          onClick={onPrevPodcast}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        {/* Main Title */}
        <div className="flex-1 text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-black leading-none">
            VOICES
          </h1>
          <h2 className="text-6xl md:text-8xl font-bold text-black leading-none">
            OF
          </h2>
          <h3 className="text-6xl md:text-8xl font-bold text-black leading-none">
            STUDENTS
          </h3>
        </div>

        {/* Next Button */}
        <button
          onClick={onNextPodcast}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 18h2V6h-2M6 18l8.5-6L6 6v12z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PodcastMainContent;
