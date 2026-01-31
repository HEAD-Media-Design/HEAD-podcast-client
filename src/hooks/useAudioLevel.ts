import { useCallback, useEffect, useRef, useState } from "react";

import type { MutableRefObject } from "react";

/**
 * Connects an audio element to a Web Audio AnalyserNode.
 * Context and connection are created only when resume() is called (user gesture).
 * For cross-origin audio we don't connect (CORS would silence playback).
 *
 * The sketch reads the analyser directly in draw() – no rAF loop here, so no extra latency.
 */
export function useAudioLevel(audioElement: HTMLAudioElement | null): {
  analyserRef: MutableRefObject<AnalyserNode | null>;
  resume: () => Promise<void>;
  isConnected: boolean;
  /** Seconds to delay visualization so it matches what's playing at the speakers. */
  outputLatency: number;
} {
  const [isConnected, setIsConnected] = useState(false);
  const [outputLatency, setOutputLatency] = useState(0);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const elementRef = useRef<HTMLAudioElement | null>(null);
  elementRef.current = audioElement;

  const resume = useCallback(async () => {
    const el = elementRef.current;
    if (!el) return;

    if (contextRef.current) {
      await contextRef.current.resume();
      return;
    }

    let skipConnection = false;
    try {
      const src = el.src;
      if (src) {
        const origin = new URL(src).origin;
        if (origin !== window.location.origin) skipConnection = true;
      }
    } catch {
      skipConnection = true;
    }
    if (skipConnection) return;

    // Low-latency context so visualization stays in sync with playback
    const ctx = new AudioContext({ latencyHint: "interactive" });
    const source = ctx.createMediaElementSource(el);
    const analyser = ctx.createAnalyser();
    // Small fftSize = minimal buffer = real-time waveform (256 @ 44.1kHz ≈ 5.8ms)
    analyser.fftSize = 256;
    // No smoothing = immediate response to pitch/amplitude
    analyser.smoothingTimeConstant = 0;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    contextRef.current = ctx;
    analyserRef.current = analyser;
    setIsConnected(true);
    await ctx.resume();
    const base = (ctx as { baseLatency?: number }).baseLatency ?? 0;
    const out = (ctx as { outputLatency?: number }).outputLatency ?? 0;
    setOutputLatency(base + out);
  }, []);

  useEffect(() => {
    return () => {
      contextRef.current?.close();
      contextRef.current = null;
      analyserRef.current = null;
      setIsConnected(false);
    };
  }, [audioElement]);

  return { analyserRef, resume, isConnected, outputLatency };
}
