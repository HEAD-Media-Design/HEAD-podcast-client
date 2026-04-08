import p5 from "p5";

import type { P5Sketch } from "../types/p5Sketch";

/**
 * Props: playback is HTML <audio>; sketch reads AnalyserNode + playback flags.
 * outputLatency: shift time-based noise so 3D path aligns with speaker output.
 */
export interface AudioReactiveSketchProps {
  analyser: AnalyserNode | null;
  simulatedLevel: number;
  isConnected: boolean;
  isPlaying: boolean;
  currentTime: number;
  /** Seconds to delay time-based viz so it syncs with speaker output. */
  outputLatency: number;
  /** 0-based playlist index; drives palette cycle 0→1→2→0… */
  playbackOrderIndex: number;
}

/** p5 typings may lag; filter shaders are WEBGL-only in p5 2.x. */
type P5Filter = p5 & {
  createFilterShader(fragSrc: string): p5.Shader;
  filter(shader: p5.Shader): void;
};

const TEXTURE_FRAG = `
precision mediump float;

uniform sampler2D tex0;
uniform vec2 texelSize;
uniform float uTime;

varying vec2 vTexCoord;

float maskMin = 0.10;
float maskMax = 0.30;
float normalStrength = 3.8;
float specPower = 20.0;
float specAmount = 0.95;
float fresnelPower = 2.5;
float fresnelAmount = 0.35;
float chromaAmount = 0.03;
float diffuseAmount = 0.12;
float highlightCompression = 0.35;

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 uv = vTexCoord;
  vec3 base = texture2D(tex0, uv).rgb;
  float center = luma(base);
  float paintMask = smoothstep(maskMin, maskMax, center);

  float l1 = luma(texture2D(tex0, uv - vec2(texelSize.x * 4.0, 0.0)).rgb);
  float r1 = luma(texture2D(tex0, uv + vec2(texelSize.x * 4.0, 0.0)).rgb);
  float u1 = luma(texture2D(tex0, uv - vec2(0.0, texelSize.y * 4.0)).rgb);
  float d1 = luma(texture2D(tex0, uv + vec2(0.0, texelSize.y * 4.0)).rgb);

  float l2 = luma(texture2D(tex0, uv - vec2(texelSize.x * 8.0, 0.0)).rgb);
  float r2 = luma(texture2D(tex0, uv + vec2(texelSize.x * 8.0, 0.0)).rgb);
  float u2 = luma(texture2D(tex0, uv - vec2(0.0, texelSize.y * 8.0)).rgb);
  float d2 = luma(texture2D(tex0, uv + vec2(0.0, texelSize.y * 8.0)).rgb);

  float dx = ((l1 - r1) * 0.7 + (l2 - r2) * 0.3);
  float dy = ((u1 - d1) * 0.7 + (u2 - d2) * 0.3);

  vec3 normal = normalize(vec3(dx * normalStrength, dy * normalStrength, 1.0));

  vec3 lightDir = normalize(vec3(
    0.65 + 0.25 * sin(uTime * 0.7),
   -0.45 + 0.20 * cos(uTime * 0.45),
    1.0
  ));

  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 reflectDir = reflect(-lightDir, normal);

  float diffuse = max(dot(normal, lightDir), 0.0);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), specPower);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), fresnelPower);

  vec3 shifted = vec3(
    texture2D(tex0, uv + vec2(texelSize.x * 1.5, 0.0)).r,
    texture2D(tex0, uv).g,
    texture2D(tex0, uv - vec2(texelSize.x * 1.5, 0.0)).b
  );

  vec3 col = base;
  col = mix(col, shifted, chromaAmount * paintMask);
  col *= 1.0 + diffuse * diffuseAmount * paintMask;
  col += vec3(1.0, 1.0, 1.06) * spec * specAmount * paintMask;
  col += vec3(0.18, 0.20, 0.24) * fresnel * fresnelAmount * paintMask;
  col = col / (1.0 + col * highlightCompression);

  float inkMask = smoothstep(0.01, 0.08, center);
  vec3 finalCol = mix(vec3(1.0), col, inkMask);

  gl_FragColor = vec4(finalCol, 1.0);
}
`;

/** Three color themes (warm / cool / green–yellow), cycled by `playbackOrderIndex % 3`. */
const THEME_HEX = [
  ["FFE500", "E79121", "E72139"],
  ["D6D6D6", "0023ff", "53CFDF"],
  ["53CFDF", "89DF53", "FFE500"],
] as const;

const COLOR_CYCLE = 60;
const MAX_SEGMENTS = 3200;
/**
 * Short grace after `isPlaying` so single-frame false drops do not stutter.
 * Kept small so pause feels immediate (no ~1s tail from a long hold).
 */
const PLAYING_HOLD_FRAMES = 3;
/** Raw RMS map floor so instant level is never exactly zero while playing. */
const LEVEL_FLOOR = 0.06;
/** Envelope: quick follow when sound rises, slow decay in silence (between words). */
const LEVEL_SMOOTH_ATTACK = 0.44;
const LEVEL_SMOOTH_RELEASE = 0.05;
/**
 * After smoothing, motion never drops below this while playing — avoids “frozen” trails in quiet audio.
 */
const MOTION_FLOOR = 0.16;
/** Floor for stroke-width blend while playing so silence still reads as a continuous tube, not dotted gaps. */
const STROKE_BLEND_FLOOR = 0.22;
/** Minimum stroke weight (px) at low volume; must overlap substeps (see stroke-aware maxStep). */
const STROKE_WEIGHT_MIN = 8.5;
/** Minimum random target drift (px/frame) while playing. */
const TARGET_WANDER_MIN = 2.75;
/** Max planar step per sub-segment so tab-throttle / big velocity does not leave visual gaps. */
const MAX_PLANAR_STEP_FRAC = 0.055;
const MAX_SUBSTEPS = 64;

function hexPalette(p: p5, hexes: readonly string[]): p5.Color[] {
  return hexes.map((hex) => p.color(`#${hex}`));
}

function smoothstep01(t: number): number {
  return t * t * (3.0 - 2.0 * t);
}

function getColorForSegment(
  p: p5,
  index: number,
  palette: p5.Color[],
): p5.Color {
  if (!palette.length) return p.color(255);
  const cycle = Math.max(24, COLOR_CYCLE);
  const tt = (index % cycle) / cycle;
  const section = tt * 3;
  const [c0, c1, c2] = palette;
  if (section < 1) {
    return p.lerpColor(c0, c1, smoothstep01(section));
  }
  if (section < 2) {
    return p.lerpColor(c1, c2, smoothstep01(section - 1));
  }
  return p.lerpColor(c2, c0, smoothstep01(section - 2));
}

function glLineFromScreen(
  p: p5,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  z1: number,
  z2: number,
  sw: number,
  segments: {
    x1: number;
    y1: number;
    z1: number;
    x2: number;
    y2: number;
    z2: number;
    w: number;
  }[],
): void {
  let prevX = ax;
  let prevY = ay;
  const posX = bx;
  const posY = by;
  if (Math.abs(posX - prevX) > p.width / 2) {
    if (posX > prevX) prevX += p.width;
    else prevX -= p.width;
  }
  if (Math.abs(posY - prevY) > p.height / 2) {
    if (posY > prevY) prevY += p.height;
    else prevY -= p.height;
  }
  const px = p.map(prevX, 0, p.width, -p.width / 2, p.width / 2);
  const py = p.map(prevY, 0, p.height, -p.height / 2, p.height / 2);
  const cx = p.map(posX, 0, p.width, -p.width / 2, p.width / 2);
  const cy = p.map(posY, 0, p.height, -p.height / 2, p.height / 2);
  segments.push({ x1: px, y1: py, z1, x2: cx, y2: cy, z2, w: sw });
}

function appendSegmentsAlongMotion(
  p: p5,
  prev: p5.Vector,
  next: p5.Vector,
  noiseT: number,
  sw: number,
  segments: {
    x1: number;
    y1: number;
    z1: number;
    x2: number;
    y2: number;
    z2: number;
    w: number;
  }[],
): void {
  const planarDist = p5.Vector.dist(prev, next);
  const canvasCap = Math.max(
    14,
    Math.min(p.width, p.height) * MAX_PLANAR_STEP_FRAC,
  );
  /** Keep steps small vs stroke so tube caps overlap (fixes “dots” when level is low). */
  const strokeCap = Math.max(sw * 0.72, 5.5);
  const maxStep = Math.min(canvasCap, strokeCap);
  const n = Math.min(
    MAX_SUBSTEPS,
    Math.max(1, Math.ceil(planarDist / maxStep)),
  );
  let fx = prev.x;
  let fy = prev.y;
  for (let k = 1; k <= n; k++) {
    const t = k / n;
    const tx = prev.x + (next.x - prev.x) * t;
    const ty = prev.y + (next.y - prev.y) * t;
    const zA = p.map(
      p.noise(fx * 0.005, fy * 0.005, noiseT),
      0,
      1,
      -220,
      220,
    );
    const zB = p.map(
      p.noise(tx * 0.005, ty * 0.005, noiseT),
      0,
      1,
      -220,
      220,
    );
    glLineFromScreen(p, fx, fy, tx, ty, zA, zB, sw, segments);
    fx = tx;
    fy = ty;
  }
}

function rmsLevel(
  analyser: AnalyserNode,
  scratch: Float32Array,
): number {
  analyser.getFloatTimeDomainData(
    scratch as unknown as Float32Array<ArrayBuffer>,
  );
  let sum = 0;
  for (let i = 0; i < scratch.length; i++) {
    const s = scratch[i];
    sum += s * s;
  }
  return Math.sqrt(sum / scratch.length);
}

export const audioReactiveSketch: P5Sketch<AudioReactiveSketchProps> = (
  p,
  getProps,
) => {
  const pf = p as P5Filter;
  let container: HTMLDivElement | null = null;
  let textureShader: p5.Shader | null = null;
  let shaderTime = 0;
  let worldAngle = 0;
  let lastPlaybackOrderIndex: number | null = null;
  let pos: p5.Vector;
  let vel: p5.Vector;
  let target: p5.Vector;
  const segments: {
    x1: number;
    y1: number;
    z1: number;
    x2: number;
    y2: number;
    z2: number;
    w: number;
  }[] = [];
  let palettes: p5.Color[][] = [];
  let levelScratch: Float32Array | null = null;
  let hasPlayedOnce = false;
  let playingHold = 0;
  let smoothLevel = 0;

  p.setup = () => {
    container = (p as unknown as { canvas?: HTMLCanvasElement }).canvas
      ?.parentElement as HTMLDivElement | null;
    const cw = container?.offsetWidth ?? 0;
    const ch = container?.offsetHeight ?? 0;
    const w = cw > 0 ? cw : Math.max(400, Math.min(800, p.windowWidth));
    const h = ch > 0 ? ch : Math.max(240, Math.min(400, p.windowHeight));
    p.createCanvas(w, h, p.WEBGL);
    p.colorMode(p.HSB, 360, 100, 100, 100);
    p.strokeCap(p.ROUND);
    p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));

    palettes = THEME_HEX.map((row) => hexPalette(p, row));
    pos = p.createVector(p.width / 2, p.height / 2);
    vel = p.createVector(0, 0);
    target = p.createVector(p.random(p.width), p.random(p.height));

    textureShader = pf.createFilterShader(TEXTURE_FRAG);
  };

  p.draw = () => {
    const {
      analyser,
      simulatedLevel,
      isConnected,
      isPlaying,
      currentTime,
      outputLatency,
      playbackOrderIndex,
    } = getProps();

    const themeIndex =
      ((playbackOrderIndex % THEME_HEX.length) + THEME_HEX.length) %
      THEME_HEX.length;
    if (lastPlaybackOrderIndex !== playbackOrderIndex) {
      lastPlaybackOrderIndex = playbackOrderIndex;
      segments.length = 0;
      smoothLevel = MOTION_FLOOR;
      if (p.width > 0 && p.height > 0) {
        pos.set(p.width / 2, p.height / 2);
        vel.set(0, 0);
        target.set(p.random(p.width), p.random(p.height));
      }
    }

    if (isPlaying) {
      hasPlayedOnce = true;
      playingHold = PLAYING_HOLD_FRAMES;
    } else if (playingHold > 0) {
      playingHold -= 1;
    }
    const visualPlaying = isPlaying || playingHold > 0;

    const effectiveTime =
      outputLatency > 0.01
        ? Math.max(0, currentTime - outputLatency)
        : currentTime;
    const noiseT = effectiveTime * 0.35;

    let level = 0;
    if (visualPlaying) {
      if (analyser) {
        const n = analyser.fftSize;
        if (!levelScratch || levelScratch.length !== n) {
          levelScratch = new Float32Array(n);
        }
        const raw = rmsLevel(analyser, levelScratch);
        level = p.constrain(p.map(raw, 0, 0.22, 0, 1), 0, 1);
      } else {
        level = p.constrain(simulatedLevel, 0, 1);
      }
    }

    const targetLevel = visualPlaying
      ? Math.max(level, LEVEL_FLOOR)
      : 0;
    const slew =
      targetLevel > smoothLevel + 0.01
        ? LEVEL_SMOOTH_ATTACK
        : LEVEL_SMOOTH_RELEASE;
    smoothLevel = p.lerp(smoothLevel, targetLevel, slew);
    smoothLevel = p.constrain(smoothLevel, 0, 1);

    const vMotion = visualPlaying
      ? Math.max(smoothLevel, MOTION_FLOOR)
      : 0;
    const connAlpha = isConnected ? 100 : 62;

    p.background(0, 0, 0);
    if (!hasPlayedOnce) {
      p.push();
      p.resetMatrix();
      p.translate(-p.width / 2, -p.height / 2, 0);
      p.fill(0, 0, 100);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text("재생하면 시각화가 시작돼요", p.width / 2, p.height / 2);
      p.pop();
    }

    if (visualPlaying) {
      worldAngle += 0.003;
    }

    p.push();
    p.rotateY(worldAngle);
    p.rotateX(worldAngle * 0.6);

    const center = p.createVector(p.width / 2, p.height / 2);
    const maxRadius = Math.min(p.width, p.height) * 0.45;

    if (visualPlaying) {
      const targetStep = p.lerp(TARGET_WANDER_MIN, 14.0, vMotion);
      target.add(p5.Vector.random2D().mult(targetStep));

      const toCenterT = p5.Vector.sub(target, center);
      if (toCenterT.mag() > maxRadius) {
        toCenterT.setMag(maxRadius);
        target = p5.Vector.add(center, toCenterT);
      }

      const prev = pos.copy();
      const speed = p.lerp(1.35, 18.0, Math.max(vMotion, 0.08));
      const toward = p5.Vector.sub(target, pos);
      let desired: p5.Vector;
      if (toward.magSq() < 16) {
        desired = p5.Vector.random2D().setMag(speed * 0.72);
      } else {
        toward.setMag(speed);
        desired = toward;
      }
      vel.lerp(desired, 0.1);
      pos.add(vel);

      const toCenterP = p5.Vector.sub(pos, center);
      if (toCenterP.mag() > maxRadius) {
        toCenterP.setMag(maxRadius);
        pos = p5.Vector.add(center, toCenterP);
      }

      const strokeBlend = Math.max(vMotion, smoothLevel, STROKE_BLEND_FLOOR);
      const sw = p.lerp(STROKE_WEIGHT_MIN, 26, strokeBlend);

      appendSegmentsAlongMotion(p, prev, pos, noiseT, sw, segments);
      while (segments.length > MAX_SEGMENTS) segments.shift();
    }

    const pal = palettes[themeIndex] ?? palettes[0];
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      const col = getColorForSegment(p, i, pal);
      p.stroke(p.hue(col), p.saturation(col), p.brightness(col), connAlpha);
      p.strokeWeight(s.w);
      p.line(s.x1, s.y1, s.z1, s.x2, s.y2, s.z2);
    }

    p.pop();

    if (visualPlaying) {
      shaderTime += 0.01;
    }
    if (textureShader) {
      textureShader.setUniform("uTime", shaderTime);
      pf.filter(textureShader);
    }
  };

  p.windowResized = () => {
    const w = container?.offsetWidth ?? p.windowWidth;
    const h = container?.offsetHeight ?? p.windowHeight;
    if (w > 0 && h > 0) p.resizeCanvas(w, h);
  };
};
