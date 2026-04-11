import "./App.css";

import AudioPlayer, { AudioPlayerRef } from "./components/AudioPlayer";
import PodcastControls, {
  PodcastControlButtons,
} from "./components/PodcastControls";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import EmptyState from "./components/EmptyState";
import ErrorPage from "./components/ErrorPage";
import Header from "./components/Header";
import InfoModal from "./components/InfoModal";
import LoadingSpinner from "./components/LoadingSpinner";
import PlaylistSidebar from "./components/PlaylistSidebar.tsx";
import PodcastMainContent from "./components/PodcastMainContent";
import { EPISODES } from "./data/episodes";
import { useAudioLevel } from "./hooks/useAudioLevel";

/** Matches shell `flex` open transition; main mounts after this so p5 doesn’t fight the layout tween. */
const LAYOUT_OPEN_MS = 2000;

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
  /** Fonts/layout ready; shell begins opening (starburst keeps spinning until `mainRevealReady`). */
  const [siteReady, setSiteReady] = useState(false);
  /** Shell open tween finished; starburst stops; main column mounts and fades in. */
  const [mainRevealReady, setMainRevealReady] = useState(false);
  /** After main mounts, next frame enables opacity transition (avoids skipped transition). */
  const [mainEntered, setMainEntered] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const [audioError, setAudioError] = useState<string | null>(null);
  const [playbackEnded, setPlaybackEnded] = useState(false);
  /** After first successful play, main viz switches from idle title sketch to audio-reactive. */
  const [hasUserPlayedAudio, setHasUserPlayedAudio] = useState(false);
  const [playButtonHovered, setPlayButtonHovered] = useState(false);

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
    let cancelled = false;
    const waitForPaint = () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

    const run = async () => {
      try {
        if (typeof document !== "undefined" && document.fonts?.ready) {
          await document.fonts.ready;
        }
      } catch {
        /* ignore */
      }
      await waitForPaint();
      if (!cancelled) setSiteReady(true);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!siteReady) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduceMotion ? 0 : LAYOUT_OPEN_MS;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const rafId = requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => setMainRevealReady(true), delay);
    });
    return () => {
      cancelAnimationFrame(rafId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [siteReady]);

  useEffect(() => {
    if (!mainRevealReady) return;
    let raf = 0;
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setMainEntered(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [mainRevealReady]);

  const goToEpisodeIndex = (index: number) => {
    const ep = EPISODES[index];
    if (!ep) return;
    navigate(`/episode/${ep.slug}`);
  };

  const nextPodcast = () => {
    if (!EPISODES.length) return;
    const continuePlayback = isPlaying;
    setShowNextPrompt(false);
    setCurrentTime(0);
    const next =
      currentPodcastIndex === EPISODES.length - 1 ? 0 : currentPodcastIndex + 1;
    goToEpisodeIndex(next);
    setIsPlaying(continuePlayback);
  };

  const prevPodcast = () => {
    if (!EPISODES.length) return;
    const continuePlayback = isPlaying;
    setShowNextPrompt(false);
    setCurrentTime(0);
    const prev =
      currentPodcastIndex === 0 ? EPISODES.length - 1 : currentPodcastIndex - 1;
    goToEpisodeIndex(prev);
    setIsPlaying(continuePlayback);
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
        setPlaybackEnded(false);
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
    if (duration > 0 && time < duration - 0.25) {
      setPlaybackEnded(false);
    }
  };

  const handleLoadedMetadata = (audioDuration: number) => {
    setDuration(audioDuration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setShowNextPrompt(true);
    setPlaybackEnded(true);
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

  useEffect(() => {
    setPlaybackEnded(false);
  }, [currentPodcastIndex]);

  useEffect(() => {
    if (isPlaying) setHasUserPlayedAudio(true);
  }, [isPlaying]);

  if (!EPISODES.length) {
    return <EmptyState />;
  }

  if (currentPodcastIndex < 0) {
    return <LoadingSpinner />;
  }

  const currentPodcast = EPISODES[currentPodcastIndex];
  if (!currentPodcast) {
    return <ErrorPage detail="Episode not found." />;
  }

  const nextPodcastItem =
    EPISODES.length &&
    (currentPodcastIndex < EPISODES.length - 1 || EPISODES.length > 1)
      ? EPISODES[(currentPodcastIndex + 1) % EPISODES.length]
      : null;

  /* duration must stay in sync with LAYOUT_OPEN_MS */
  const shellTween =
    "transition-[flex-grow,flex-basis] duration-[2000ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0";

  const spacerLoading = `${shellTween} min-h-0 flex-1 basis-0 grow`;
  const spacerReady = `${shellTween} h-0 min-h-0 shrink-0 grow-0 basis-0 overflow-hidden`;

  const mainRailLoading = `${shellTween} h-0 min-h-0 shrink-0 grow-0 basis-0 overflow-hidden`;
  const mainRailReady = `${shellTween} min-h-0 flex-1 basis-0 overflow-hidden`;

  return (
    <div
      className="h-dvh-fallback flex flex-col bg-white overflow-hidden"
      aria-busy={!mainRevealReady}
    >
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
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="absolute inset-0 z-10 flex min-h-0 flex-col bg-white">
          <div
            className={siteReady ? spacerReady : spacerLoading}
            aria-hidden
          />
          <div className="z-20 shrink-0 bg-white">
            <Header
              onInfoClick={() => setIsInfoOpen(!isInfoOpen)}
              isInfoOpen={isInfoOpen}
              logoSpinning={!mainRevealReady}
            />
          </div>
          <div className={siteReady ? mainRailReady : mainRailLoading}>
            <div
              className={`h-full min-h-0 transition-opacity duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0 ${
                mainEntered ? "opacity-100" : "opacity-0"
              }`}
            >
              {mainRevealReady ? (
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
                  hasUserPlayedAudio={hasUserPlayedAudio}
                  isPlayButtonHovered={playButtonHovered}
                />
              ) : (
                <div className="h-full min-h-0 bg-white" aria-hidden />
              )}
            </div>
          </div>
          <div className="relative z-20 shrink-0 max-md:pb-[env(safe-area-inset-bottom,0px)]">
            <div className="absolute right-4 md:right-6 top-0 -translate-y-[calc(50%+4rem)] md:-translate-y-1/2 z-10">
              <PodcastControlButtons
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onListClick={() => setIsPlaylistOpen(true)}
                onPlayButtonHoverChange={setPlayButtonHovered}
              />
            </div>
            <PodcastControls
              podcast={currentPodcast}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              playbackEnded={playbackEnded}
              onTogglePlay={togglePlay}
              onListClick={() => setIsPlaylistOpen(true)}
              onSeek={handleSeek}
              audioError={audioError}
              onDismissAudioError={() => setAudioError(null)}
              renderButtonsSeparately
              onPlayButtonHoverChange={setPlayButtonHovered}
            />
          </div>
          <div
            className={siteReady ? spacerReady : spacerLoading}
            aria-hidden
          />
        </div>
        {isInfoOpen && <InfoModal onClose={() => setIsInfoOpen(false)} />}
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
