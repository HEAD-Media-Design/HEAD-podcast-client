import type { P5Sketch } from "../types/p5Sketch";

/**
 * Props: playback is done by HTML <audio>; sketch only visualizes from AnalyserNode.
 * outputLatency: delay viz by this many seconds so it matches what's playing at the speakers.
 */
export interface AudioReactiveSketchProps {
  analyser: AnalyserNode | null;
  simulatedLevel: number;
  isConnected: boolean;
  isPlaying: boolean;
  currentTime: number;
  /** Seconds to delay waveform so it syncs with speaker output (Web Audio output latency). */
  outputLatency: number;
}

const RED_BG = [229, 57, 53] as const; // #E53935

/**
 * Waveform from AnalyserNode (same stream as HTML audio) so viz is in sync.
 * No p5.sound – no CORS load; playback is HTML <audio> which works with external URLs.
 */
const MAX_HISTORY = 120; // ~2s at 60fps

export const audioReactiveSketch: P5Sketch<AudioReactiveSketchProps> = (
  p,
  getProps,
) => {
  let container: HTMLDivElement | null = null;
  let waveformBuffer: Float32Array | null = null;
  type Frame = { audioTime: number; buffer: Float32Array };
  const history: Frame[] = [];

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    container = (p as unknown as { canvas?: HTMLCanvasElement }).canvas
      ?.parentElement as HTMLDivElement | null;
    const w = container?.offsetWidth ?? p.width;
    const h = container?.offsetHeight ?? p.height;
    if (w > 0 && h > 0) p.resizeCanvas(w, h);
  };

  p.draw = () => {
    p.background(RED_BG[0], RED_BG[1], RED_BG[2]);
    const { analyser, simulatedLevel, isPlaying, currentTime, outputLatency } =
      getProps();
    const centerY = p.height / 2;
    const waveAmplitude = p.height * 0.35;

    if (analyser) {
      const fftSize = analyser.fftSize;
      if (!waveformBuffer || waveformBuffer.length !== fftSize) {
        waveformBuffer = new Float32Array(fftSize);
      }
      analyser.getFloatTimeDomainData(
        waveformBuffer as unknown as Float32Array<ArrayBuffer>,
      );

      let drawBuffer: Float32Array;
      if (outputLatency > 0.01) {
        history.push({
          audioTime: currentTime,
          buffer: new Float32Array(waveformBuffer),
        });
        if (history.length > MAX_HISTORY) history.shift();
        const targetTime = currentTime - outputLatency;
        let frame = history[history.length - 1];
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].audioTime <= targetTime) {
            frame = history[i];
            break;
          }
        }
        drawBuffer = frame.buffer;
      } else {
        drawBuffer = waveformBuffer;
      }

      p.noFill();
      p.stroke(255, 255, 255, 220);
      p.strokeWeight(2);
      p.beginShape();
      for (let i = 0; i < drawBuffer.length; i++) {
        const x = p.map(i, 0, drawBuffer.length, 0, p.width);
        const y = centerY + drawBuffer[i] * waveAmplitude;
        p.vertex(x, y);
      }
      p.endShape();
    } else if (isPlaying) {
      const len = 1024;
      p.noFill();
      p.stroke(255, 255, 255, 220);
      p.strokeWeight(2);
      p.beginShape();
      const t = p.frameCount * 0.05;
      const amp = waveAmplitude * (0.3 + simulatedLevel * 0.7);
      for (let i = 0; i <= len; i++) {
        const x = p.map(i, 0, len, 0, p.width);
        const y =
          centerY +
          p.sin((i / len) * p.TWO_PI * 4 + t) *
            amp *
            (0.5 + simulatedLevel * 0.5);
        p.vertex(x, y);
      }
      p.endShape();
    } else {
      p.fill(255);
      p.noStroke();
      p.textSize(14);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(
        "Cross-origin audio: waveform only when same origin",
        p.width / 2,
        p.height / 2,
      );
      p.textAlign(p.LEFT, p.BASELINE);
    }
  };

  p.windowResized = () => {
    const w = container?.offsetWidth ?? p.windowWidth;
    const h = container?.offsetHeight ?? p.windowHeight;
    if (w > 0 && h > 0) p.resizeCanvas(w, h);
  };
};
