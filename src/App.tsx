import "./App.css";

import AudioPlayer, { AudioPlayerRef } from "./components/AudioPlayer";
import { useEffect, useRef, useState } from "react";

import EmptyState from "./components/EmptyState";
import ErrorMessage from "./components/ErrorMessage";
import Header from "./components/Header";
// Import components
import LoadingSpinner from "./components/LoadingSpinner";
import { Podcast } from "./types/podcast";
import PodcastControls from "./components/PodcastControls";
import PodcastMainContent from "./components/PodcastMainContent";
import axios from "axios";

function App() {
  const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [currentPodcastIndex, setCurrentPodcastIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  const getPodcasts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${STRAPI_URL}/api/podcasts?populate=*`);
      console.log(response.data.data);
      setPodcasts(response.data.data);
    } catch (err) {
      console.error("Error fetching podcasts:", err);
      setError("Failed to load podcasts. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPodcasts();
  }, []);

  const nextPodcast = () => {
    setCurrentPodcastIndex((prev) =>
      prev === podcasts.length - 1 ? 0 : prev + 1
    );
  };

  const prevPodcast = () => {
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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={getPodcasts} />;
  }

  const currentPodcast = podcasts[currentPodcastIndex];

  if (!currentPodcast) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Audio Player */}
      <AudioPlayer
        ref={audioPlayerRef}
        audioUrl={currentPodcast.audio?.url || ""}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <PodcastMainContent
        onPrevPodcast={prevPodcast}
        onNextPodcast={nextPodcast}
      />

      {/* Controls */}
      <PodcastControls
        podcast={currentPodcast}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={togglePlay}
      />
    </div>
  );
}

export default App;
