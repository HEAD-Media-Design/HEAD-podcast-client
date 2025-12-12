import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

interface AudioPlayerProps {
  audioUrl: string;
  onTimeUpdate: (time: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onEnded: () => void;
}

export interface AudioPlayerRef {
  play: () => Promise<void> | undefined;
  pause: () => void;
  currentTime: number;
  duration: number;
}

const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ audioUrl, onTimeUpdate, onLoadedMetadata, onEnded }, ref) => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load();
      }
    }, [audioUrl]);

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
      currentTime: audioRef.current?.currentTime || 0,
      duration: audioRef.current?.duration || 0,
    }));

    return (
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
    );
  }
);

AudioPlayer.displayName = "AudioPlayer";

export default AudioPlayer;
