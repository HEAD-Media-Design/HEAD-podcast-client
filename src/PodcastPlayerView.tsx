import "./App.css";

import AudioPlayer, { AudioPlayerRef } from "./components/AudioPlayer";
import PodcastControls, {
  PodcastControlButtons,
} from "./components/PodcastControls";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import EmptyState from "./components/EmptyState";
import ErrorMessage from "./components/ErrorMessage";
import Header from "./components/Header";
import InfoModal from "./components/InfoModal";
import LoadingSpinner from "./components/LoadingSpinner";
import PlaylistSidebar from "./components/PlaylistSidebar.tsx";
import PodcastMainContent from "./components/PodcastMainContent";
import { EPISODES } from "./data/episodes";
import { useAudioLevel } from "./hooks/useAudioLevel";

function PodcastPlayerView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const currentPodcastIndex = useMemo(() => {
    const i = EPISODES.findIndex((e) => e.slug === slug);
    return i;
  }, [slug]);

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
    if (currentPodcastIndex < 0 && EPISODES.length > 0) {
      navigate(`/episode/${EPISODES[0]!.slug}`, { replace: true });
    }
  }, [currentPodcastIndex, navigate]);

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

  useEffect(() => {
    const centerTimer = setTimeout(() => {
      setAnimationStage("center");
    }, 100);

    const finalTimer = setTimeout(() => {
      setAnimationStage("final");
    }, 1500);

    return () => {
      clearTimeout(centerTimer);
      clearTimeout(finalTimer);
    };
  }, []);

  const goToEpisodeIndex = (index: number) => {
    const ep = EPISODES[index];
    if (!ep) return;
    navigate(`/episode/${ep.slug}`);
  };

  const nextPodcast = () => {
    if (!EPISODES.length) return;
    setShowNextPrompt(false);
    setCurrentTime(0);
    const next =
      currentPodcastIndex === EPISODES.length - 1 ? 0 : currentPodcastIndex + 1;
    goToEpisodeIndex(next);
    setIsPlaying(true);
  };

  const prevPodcast = () => {
    if (!EPISODES.length) return;
    setShowNextPrompt(false);
    setCurrentTime(0);
    const prev =
      currentPodcastIndex === 0 ? EPISODES.length - 1 : currentPodcastIndex - 1;
    goToEpisodeIndex(prev);
    setIsPlaying(true);
  };

  const playNextPodcast = () => {
    if (!EPISODES.length) return;
    setShowNextPrompt(false);
    setCurrentTime(0);
    const next =
      currentPodcastIndex === EPISODES.length - 1 ? 0 : currentPodcastIndex + 1;
    goToEpisodeIndex(next);
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

  useEffect(() => {
    setAudioError(null);
  }, [currentPodcastIndex]);

  if (!EPISODES.length) {
    return <EmptyState />;
  }

  if (currentPodcastIndex < 0) {
    return <LoadingSpinner />;
  }

  const currentPodcast = EPISODES[currentPodcastIndex];
  if (!currentPodcast) {
    return (
      <ErrorMessage
        error="Episode not found."
        onRetry={() => navigate(`/episode/${EPISODES[0]!.slug}`, { replace: true })}
      />
    );
  }

  const nextPodcastItem =
    EPISODES.length &&
    (currentPodcastIndex < EPISODES.length - 1 || EPISODES.length > 1)
      ? EPISODES[(currentPodcastIndex + 1) % EPISODES.length]
      : null;

  return (
    <div className="h-dvh-fallback flex flex-col bg-white overflow-hidden">
      <AudioPlayer
        ref={audioPlayerRef}
        audioUrl={currentPodcast.audioUrl}
        isPlaying={isPlaying}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleAudioError}
        onResumeBeforePlay={resumeAudioContext}
        onAudioElementReady={setAudioElement}
      />
      <div
        className={`z-20 transition-transform duration-1000 ease-out bg-white ${
          animationStage === "initial"
            ? "opacity-0"
            : animationStage === "center"
              ? "translate-y-[calc(50dvh-65px)] md:translate-y-[calc(50dvh-150px)]"
              : "translate-y-0"
        }`}
      >
        <Header
          onInfoClick={() => setIsInfoOpen(!isInfoOpen)}
          isInfoOpen={isInfoOpen}
        />
      </div>

      <div className="relative flex-1 flex flex-col h-full overflow-hidden">
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
            playbackOrderIndex={currentPodcastIndex}
          />
        </div>

        <div className="relative z-20">
          <div className="absolute right-4 md:right-6 top-0 -translate-y-[calc(50%+4rem)] md:-translate-y-1/2 z-10">
            <PodcastControlButtons
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              onListClick={() => setIsPlaylistOpen(true)}
            />
          </div>
          <div
            className={`transition-transform duration-1000 ease-out ${
              animationStage === "initial"
                ? "opacity-0"
                : animationStage === "center"
                  ? "-translate-y-[calc(50dvh-65px)] md:-translate-y-[calc(50dvh-150px)]"
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
              renderButtonsSeparately
            />
          </div>
        </div>
        {isInfoOpen && <InfoModal />}
        <PlaylistSidebar
          isOpen={isPlaylistOpen}
          onClose={() => setIsPlaylistOpen(false)}
          podcasts={[...EPISODES]}
          currentPodcastIndex={currentPodcastIndex}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onSelectPodcast={(index: number) => {
            setShowNextPrompt(false);
            goToEpisodeIndex(index);
            setCurrentTime(0);
            setIsPlaying(true);
          }}
        />
      </div>
    </div>
  );
}

export default PodcastPlayerView;
