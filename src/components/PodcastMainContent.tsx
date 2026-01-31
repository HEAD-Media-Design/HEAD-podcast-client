import React, { useMemo } from "react";

import NextButton from "./NextButton";
import P5Canvas from "./P5Canvas";
import { Podcast } from "../types/podcast";
import PrevButton from "./PrevButton";
import { audioReactiveSketch } from "../sketches/audioReactiveSketch";

interface PodcastMainContentProps {
  currentPodcast: Podcast;
  nextPodcast: Podcast | null;
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
}

const DEFAULT_TRANSCRIPT =
  "Hi folks, welcome to Supernova, where we discuss algorithms beyond us. I'm your host Peter Ha and I'll be talking about mobile photography and how we select and manage photos.";

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
}) => {
  const transcript =
    currentPodcast.transcript ||
    currentPodcast.description ||
    DEFAULT_TRANSCRIPT;
  const year =
    typeof currentPodcast.category?.name === "string"
      ? currentPodcast.category?.name.split("_")[1]
      : "2024";

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
    }),
    [
      isConnected,
      isPlaying,
      currentTime,
      outputLatency,
      analyserRef,
      simulatedLevelRef,
    ],
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col md:flex-row h-full overflow-hidden relative">
      <div className="flex-shrink-0 w-full md:w-[50%] bg-[#E53935] relative flex items-center justify-center md:h-full h-1/2 overflow-hidden">
        <P5Canvas
          sketch={audioReactiveSketch}
          props={p5Props}
          className="w-full h-full"
        />
      </div>
      <PrevButton
        onClick={onPrevPodcast}
        className="absolute left-4 top-1/2 -translate-y-1/2"
      />
      <NextButton
        onClick={onNextPodcast}
        className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2"
      />

      {/* Right panel: Transcript (yellow) - fills height, scrolls when content overflows */}
      <div className="flex-1 min-h-0 h-full transcript-panel bg-[#FACC15] md:min-w-0 px-4 md:px-0 text-left relative py-6 px-14">
        <div className="transcript-panel-grid px-0">
          {/* Title */}
          <div className="transcript-panel-title px-2 md:px-6 md:py-10 md:pr-4 pb-6">
            <h2 className="font-spline-sans-mono font-bold text-black text-2xl md:text-3xl">
              Transcript
            </h2>
          </div>

          {/* Transcript text - one copy */}
          <div className="transcript-panel-transcript min-h-0 px-2 md:px-8 md:pl-6 md:py-10">
            <p className="font-spline-sans text-black text-sm md:text-base whitespace-pre-wrap pr-8 md:pr-14">
              {transcript}
            </p>
          </div>

          {/* Metadata + Next Podcast - one copy */}
          <div className="transcript-panel-meta px-2 md:px-6 md:pr-4 md:pb-8 pt-6">
            <p className="font-spline-sans font-bold text-black text-sm md:text-base mb-6 md:mb-10">
              Completed in Master Media Design Theory Seminar {year}
            </p>
            <div className="mb-4 md:mb-6">
              <p className="font-spline-sans font-bold text-black text-xs uppercase tracking-wide mb-1 md:mb-2">
                ABOUT
              </p>
              <p className="font-spline-sans text-black text-sm leading-tight">
                {currentPodcast.description}
              </p>
            </div>
            <div className="mb-8 md:mb-0">
              <p className="font-spline-sans font-bold text-black text-xs uppercase tracking-wide mb-1 md:mb-2">
                TEACHER
              </p>
              <p className="font-spline-sans text-black text-sm">
                Nicolas Nova
              </p>
            </div>
          </div>
        </div>

        {/* Next Podcast: centered overlay on yellow panel, focus when showNextPrompt */}
        {nextPodcast && showNextPrompt && (
          <div
            tabIndex={-1}
            className="absolute inset-0 bg-[#FACC15] flex items-center justify-center px-4 md:px-6 outline-none"
            aria-label="Next podcast"
          >
            <div className="min-w-0 max-w-md w-full">
              <h3 className="font-spline-sans-mono font-bold text-black text-lg mb-4">
                {nextPodcast.title}
              </h3>
              <p className="font-spline-sans text-black text-sm line-clamp-2 mb-4">
                {nextPodcast.description}
              </p>
              <button
                type="button"
                onClick={onPlayNext}
                className="font-spline-sans-mono font-bold text-black text-lg cursor-pointer hover:underline"
              >
                Play
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PodcastMainContent;
