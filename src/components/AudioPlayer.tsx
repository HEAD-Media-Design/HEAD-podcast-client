import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

interface AudioPlayerProps {
  audioUrl: string;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onEnded: () => void;
  /** Called before play() when auto-playing after url change. Ensures AudioContext is resumed. */
  onResumeBeforePlay?: () => Promise<void>;
  /** Called when the audio element is mounted or url changes. Use for analyser, etc. */
  onAudioElementReady?: (element: HTMLAudioElement | null) => void;
}

export interface AudioPlayerRef {
  play: () => Promise<void> | undefined;
  pause: () => void;
  seekTo: (time: number) => void;
  currentTime: number;
  duration: number;
}

const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  (
    {
      audioUrl,
      isPlaying,
      onTimeUpdate,
      onLoadedMetadata,
      onEnded,
      onResumeBeforePlay,
      onAudioElementReady,
    },
    ref,
  ) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const isPlayingRef = useRef(isPlaying);
    isPlayingRef.current = isPlaying;

    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
      }
    }, [audioUrl]);

    useEffect(() => {
      onAudioElementReady?.(audioRef.current ?? null);
    }, [audioUrl, onAudioElementReady]);

    const handleCanPlay = async () => {
      if (!isPlayingRef.current || !audioRef.current) return;
      await onResumeBeforePlay?.();
      await audioRef.current.play();
    };

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        onTimeUpdate(audioRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        onLoadedMetadata(audioRef.current.duration);
      }
    };

    const handleEnded = () => {
      onEnded();
    };

    useImperativeHandle(ref, () => ({
      play: () => audioRef.current?.play(),
      pause: () => audioRef.current?.pause(),
      seekTo: (time: number) => {
        if (audioRef.current) {
          audioRef.current.currentTime = time;
        }
      },
      get currentTime() {
        return audioRef.current?.currentTime ?? 0;
      },
      get duration() {
        return audioRef.current?.duration ?? 0;
      },
    }));

    return (
      <audio
        ref={audioRef}
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
    );
  },
);

AudioPlayer.displayName = "AudioPlayer";

export default AudioPlayer;
