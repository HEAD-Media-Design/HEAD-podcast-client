import "./App.css";

import AudioPlayer, { AudioPlayerRef } from "./components/AudioPlayer";
import { useEffect, useRef, useState } from "react";

import EmptyState from "./components/EmptyState";
import ErrorMessage from "./components/ErrorMessage";
import Header from "./components/Header";
import InfoModal from "./components/InfoModal";
// Import components
import LoadingSpinner from "./components/LoadingSpinner";
import PodcastControls from "./components/PodcastControls";
import PodcastMainContent from "./components/PodcastMainContent";
import { usePodcasts } from "./hooks/usePodcasts";

function App() {
  const { podcasts, error, isLoading, refetch } = usePodcasts();

  const [currentPodcastIndex, setCurrentPodcastIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [animationStage, setAnimationStage] = useState<
    "initial" | "center" | "final"
  >("initial");

  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  // Opening animation sequence - runs on every refresh
  useEffect(() => {
    // Stage 1: Show centered (after mount)
    const centerTimer = setTimeout(() => {
      setAnimationStage("center");
    }, 100);

    // Stage 2: Animate to final positions
    const finalTimer = setTimeout(() => {
      setAnimationStage("final");
    }, 1500);

    return () => {
      clearTimeout(centerTimer);
      clearTimeout(finalTimer);
    };
  }, []);

  const nextPodcast = () => {
    if (!podcasts) return;
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentPodcastIndex((prev) =>
      prev === podcasts.length - 1 ? 0 : prev + 1
    );
  };

  const prevPodcast = () => {
    if (!podcasts) return;
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentPodcastIndex((prev) =>
      prev === 0 ? podcasts.length - 1 : prev - 1
    );
  };

  const togglePlay = () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
      } else {
        audioPlayerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleLoadedMetadata = (audioDuration: number) => {
    setDuration(audioDuration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorMessage
        error="Failed to load podcasts. Please try again later."
        onRetry={() => refetch()}
      />
    );
  }

  const currentPodcast = podcasts?.[currentPodcastIndex];

  if (!currentPodcast) {
    return <EmptyState />;
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Audio Player */}
      <AudioPlayer
        ref={audioPlayerRef}
        audioUrl={currentPodcast.audio?.url || ""}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Header - animates from center to top */}
      <div
        className={`z-20 transition-transform duration-1000 ease-out ${
          animationStage === "initial"
            ? "opacity-0"
            : animationStage === "center"
            ? "translate-y-[calc(50vh-65px)] md:translate-y-[calc(50vh-150px)]"
            : "translate-y-0"
        }`}
      >
        <Header
          onInfoClick={() => setIsInfoOpen(!isInfoOpen)}
          isInfoOpen={isInfoOpen}
        />
      </div>

      <div className="relative flex-1 flex flex-col h-full overflow-hidden">
        {/* Main Content - hidden during animation */}
        <div
          className={`flex-1 transition-opacity duration-500 ${
            animationStage === "final" ? "opacity-100" : "opacity-0"
          }`}
        >
          <PodcastMainContent
            onPrevPodcast={prevPodcast}
            onNextPodcast={nextPodcast}
          />
        </div>

        {/* Controls - animates from center to bottom */}
        <div
          className={`z-20 transition-transform duration-1000 ease-out ${
            animationStage === "initial"
              ? "opacity-0"
              : animationStage === "center"
              ? "-translate-y-[calc(50vh-65px)] md:-translate-y-[calc(50vh-150px)]"
              : "translate-y-0"
          }`}
        >
          <PodcastControls
            podcast={currentPodcast}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onTogglePlay={togglePlay}
          />
        </div>
        {isInfoOpen && <InfoModal />}
      </div>
    </div>
  );
}

export default App;
