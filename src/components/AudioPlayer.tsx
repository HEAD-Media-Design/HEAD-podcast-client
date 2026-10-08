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

/** Reload attempts after a network/decode error before the error is shown (per episode). */
const MAX_RECOVERY_ATTEMPTS = 2;

/** `play()` rejects with AbortError when a newer `load()` (e.g. a quick swipe) interrupts it. */
function isAbortError(err: unknown) {
  return err instanceof DOMException && err.name === "AbortError";
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
    /** Last known playback position, used to resume after a recovery reload. */
    const lastTimeRef = useRef(0);
    const recoveryAttemptsRef = useRef(0);

    useEffect(() => {
      const el = audioRef.current;
      if (!el) return;

      el.src = audioUrl;
      el.load();
      lastTimeRef.current = 0;
      recoveryAttemptsRef.current = 0;

      if (!isPlayingRef.current) return;

      let cancelled = false;

      const startPlayback = async () => {
        if (cancelled || !isPlayingRef.current || !audioRef.current) return;
        try {
          await onResumeBeforePlayRef.current?.();
          if (cancelled || !isPlayingRef.current || !audioRef.current) return;
          await audioRef.current.play();
        } catch (err) {
          if (!cancelled && !isAbortError(err)) onErrorRef.current?.(err);
        }
      };

      // Call play() right away instead of waiting for `canplay`: iOS Safari doesn't buffer
      // beyond metadata until play() is requested, so waiting stalled episode switches for seconds.
      // The browser starts playback as soon as enough data has arrived.
      void startPlayback();

      return () => {
        cancelled = true;
      };
    }, [audioUrl]);

    useEffect(() => {
      onAudioElementReady?.(audioRef.current ?? null);
    }, [audioUrl, onAudioElementReady]);

    const handleError = () => {
      const el = audioRef.current;
      // Switching episodes aborts the previous load; that's not a playback failure.
      if (!el || el.error?.code === MediaError.MEDIA_ERR_ABORTED) return;

      // Mobile connections drop mid-stream (and iOS reports some of those as decode errors):
      // reload the same source and continue from where it stopped before giving up.
      const recoverable =
        el.error?.code === MediaError.MEDIA_ERR_NETWORK ||
        el.error?.code === MediaError.MEDIA_ERR_DECODE;
      if (recoverable && recoveryAttemptsRef.current < MAX_RECOVERY_ATTEMPTS) {
        recoveryAttemptsRef.current += 1;
        const resumeAt = lastTimeRef.current;
        const recoveringSrc = el.src;
        el.addEventListener(
          "loadedmetadata",
          () => {
            if (el.src !== recoveringSrc) return; // switched episodes meanwhile
            el.currentTime = resumeAt;
            if (isPlayingRef.current) {
              el.play().catch((err: unknown) => {
                if (!isAbortError(err)) onErrorRef.current?.(err);
              });
            }
          },
          { once: true },
        );
        const reload = () => {
          if (el.src === recoveringSrc) el.load();
        };
        // Retrying while still offline would just fail again: wait for the connection,
        // otherwise back off briefly (1s, then 2s).
        if (!navigator.onLine) {
          window.addEventListener("online", reload, { once: true });
        } else {
          window.setTimeout(reload, 1000 * recoveryAttemptsRef.current);
        }
        return;
      }

      const message =
        el?.error?.message ??
        (el?.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
          ? "Unsupported source or format"
          : "Failed to load audio");
      onError?.(new Error(message));
    };

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        lastTimeRef.current = audioRef.current.currentTime;
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
        if (p?.catch)
          p.catch((err: unknown) => {
            if (!isAbortError(err)) onError?.(err);
          });
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
