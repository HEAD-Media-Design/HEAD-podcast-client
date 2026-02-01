import "./App.css";

import AudioPlayer, { AudioPlayerRef } from "./components/AudioPlayer";
import { useEffect, useRef, useState } from "react";

import EmptyState from "./components/EmptyState";
import ErrorMessage from "./components/ErrorMessage";
import Header from "./components/Header";
import InfoModal from "./components/InfoModal";
import LoadingSpinner from "./components/LoadingSpinner";
import PlaylistSidebar from "./components/PlaylistSidebar.tsx";
import PodcastControls from "./components/PodcastControls";
import PodcastMainContent from "./components/PodcastMainContent";
import { useAudioLevel } from "./hooks/useAudioLevel";
import { usePodcasts } from "./hooks/usePodcasts";

function App() {
  const { podcasts, error, isLoading, refetch } = usePodcasts();

  const [currentPodcastIndex, setCurrentPodcastIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [showNextPrompt, setShowNextPrompt] = useState(false);
  const [animationStage, setAnimationStage] = useState<
    "initial" | "center" | "final"
  >("initial");
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const {
    analyserRef,
    resume: resumeAudioContext,
    isConnected,
    outputLatency,
  } = useAudioLevel(audioElement);
  const simulatedLevelRef = useRef(0);

  useEffect(() => {
    if (isConnected || !isPlaying) return;
    let raf = 0;
    const update = () => {
      const t = Date.now() / 400;
      simulatedLevelRef.current =
        0.35 + 0.3 * Math.sin(t) + 0.1 * Math.sin(t * 2.3);
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [isConnected, isPlaying]);

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
    setShowNextPrompt(false);
    setCurrentTime(0);
    setCurrentPodcastIndex((prev) =>
      prev === podcasts.length - 1 ? 0 : prev + 1,
    );
    setIsPlaying(true);
  };

  const prevPodcast = () => {
    if (!podcasts) return;
    setShowNextPrompt(false);
    setCurrentTime(0);
    setCurrentPodcastIndex((prev) =>
      prev === 0 ? podcasts.length - 1 : prev - 1,
    );
    setIsPlaying(true);
  };

  const playNextPodcast = () => {
    if (!podcasts) return;
    setShowNextPrompt(false);
    setCurrentTime(0);
    setCurrentPodcastIndex((prev) =>
      prev === podcasts.length - 1 ? 0 : prev + 1,
    );
    setIsPlaying(true);
  };

  const togglePlay = async () => {
    if (audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        setShowNextPrompt(false);
        await resumeAudioContext();
        await audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleSeek = (time: number) => {
    audioPlayerRef.current?.seekTo(time);
    setCurrentTime(time);
  };

  const handleLoadedMetadata = (audioDuration: number) => {
    setDuration(audioDuration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setShowNextPrompt(true);
  };

  const handleAudioError = (error: unknown) => {
    setIsPlaying(false);
    setAudioError(
      error instanceof Error ? error.message : "Could not load or play audio",
    );
  };

  // Clear audio error when switching podcast
  useEffect(() => {
    setAudioError(null);
  }, [currentPodcastIndex]);

  // Auto-play after next/prev/sidebar: play() is triggered by AudioPlayer's onCanPlay when source is ready

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
  const nextPodcastItem =
    podcasts?.length &&
    (currentPodcastIndex < podcasts.length - 1 || podcasts.length > 1)
      ? podcasts[(currentPodcastIndex + 1) % podcasts.length]
      : null;

  if (!currentPodcast) {
    return <EmptyState />;
  }

  return (
    <div className="h-dvh-fallback flex flex-col bg-white overflow-hidden">
      <AudioPlayer
        ref={audioPlayerRef}
        audioUrl={currentPodcast.audio?.url || ""}
        isPlaying={isPlaying}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleAudioError}
        onResumeBeforePlay={resumeAudioContext}
        onAudioElementReady={setAudioElement}
      />
      {/* Header - animates from center to top */}
      <div
        className={`z-20 transition-transform duration-1000 ease-out bg-white ${
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
          className={`flex-1 min-h-0 transition-opacity duration-500 ${
            animationStage === "final" ? "opacity-100" : "opacity-0"
          }`}
        >
          <PodcastMainContent
            currentPodcast={currentPodcast}
            nextPodcast={nextPodcastItem ?? null}
            showNextPrompt={showNextPrompt}
            onPrevPodcast={prevPodcast}
            onNextPodcast={nextPodcast}
            onPlayNext={playNextPodcast}
            analyserRef={analyserRef}
            simulatedLevelRef={simulatedLevelRef}
            isConnected={isConnected}
            isPlaying={isPlaying}
            currentTime={currentTime}
            outputLatency={outputLatency}
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
            onListClick={() => setIsPlaylistOpen(true)}
            onSeek={handleSeek}
            audioError={audioError}
            onDismissAudioError={() => setAudioError(null)}
          />
        </div>
        {isInfoOpen && <InfoModal />}
        <PlaylistSidebar
          isOpen={isPlaylistOpen}
          onClose={() => setIsPlaylistOpen(false)}
          podcasts={podcasts}
          currentPodcastIndex={currentPodcastIndex}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onSelectPodcast={(index: number) => {
            setShowNextPrompt(false);
            setCurrentPodcastIndex(index);
            setCurrentTime(0);
            setIsPlaying(true);
          }}
        />
      </div>
    </div>
  );
}

export default App;
