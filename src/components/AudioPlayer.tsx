import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

interface AudioPlayerProps {
  audioUrl: string;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onEnded: () => void;
  /** Called when load or play fails (e.g. NotSupportedError, CORS, unsupported format). */
  onError?: (error: unknown) => void;
  onResumeBeforePlay?: () => Promise<void>;
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
      onError,
      onResumeBeforePlay,
      onAudioElementReady,
    },
    ref,
  ) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const isPlayingRef = useRef(isPlaying);
    isPlayingRef.current = isPlaying;
    const onResumeBeforePlayRef = useRef(onResumeBeforePlay);
    onResumeBeforePlayRef.current = onResumeBeforePlay;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    useEffect(() => {
      const el = audioRef.current;
      if (!el) return;

      el.src = audioUrl;
      el.load();

      if (!isPlayingRef.current) return;

      let cancelled = false;

      const startPlayback = async () => {
        if (cancelled || !isPlayingRef.current || !audioRef.current) return;
        try {
          await onResumeBeforePlayRef.current?.();
          if (cancelled || !isPlayingRef.current || !audioRef.current) return;
          await audioRef.current.play();
        } catch (err) {
          if (!cancelled) onErrorRef.current?.(err);
        }
      };

      // After load(), rely on canplay — the JSX onCanPlay handler can miss if the
      // event already fired or behaves inconsistently across browsers when src changes.
      if (el.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        void startPlayback();
      } else {
        el.addEventListener("canplay", startPlayback, { once: true });
      }

      return () => {
        cancelled = true;
        el.removeEventListener("canplay", startPlayback);
      };
    }, [audioUrl]);

    useEffect(() => {
      onAudioElementReady?.(audioRef.current ?? null);
    }, [audioUrl, onAudioElementReady]);

    const handleError = () => {
      const el = audioRef.current;
      const message =
        el?.error?.message ??
        (el?.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
          ? "Unsupported source or format"
          : "Failed to load audio");
      onError?.(new Error(message));
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
      play: () => {
        const p = audioRef.current?.play();
        if (p?.catch) p.catch((err: unknown) => onError?.(err));
        return p;
      },
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
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
      />
    );
  },
);

AudioPlayer.displayName = "AudioPlayer";

export default AudioPlayer;
