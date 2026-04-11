/**
 * Port of `/Users/haneul/Downloads/final/sketch.js` (+ matching `shader.vert` / `shader.frag`).
 * Original used `assets/SF-Pro-Display-Medium.otf`; this build loads that URL if present,
 * otherwise `/fonts/Inter-24pt-Regular.ttf` (bundled under public/fonts).
 */
import p5 from "p5";

import type { P5Sketch } from "../types/p5Sketch";

import fragSrc from "./algoTitleShader.frag?raw";
import vertSrc from "./algoTitleShader.vert?raw";

const FONT_PRIMARY = "/fonts/SF-Pro-Display-Medium.otf";
const FONT_FALLBACK = "/fonts/Inter-24pt-Regular.ttf";

export interface AlgoTitleSketchProps {
  /** Mirrors global `isButtonHovered` from the original `index.html` + play button. */
  isPlayButtonHovered: boolean;
}

type LineDef = { text: string; x?: number; y?: number };
type PointDef = {
  x: number;
  y: number;
  factor: number;
  letterIndex: number;
  nx: number;
  ny: number;
};

export const algoTitleSketch: P5Sketch<AlgoTitleSketchProps> = (
  p,
  getProps,
) => {
  let fontPoints: p5.Font | null = null;
  let allPoints: PointDef[] = [];
  const cp = ["#0022ff"];

  let fontSize = 200;
  /** Pre-fit target size for the active layout; reset on resize before `fitFontSizeToRef`. */
  let layoutTargetFontSize = 200;
  let lines: LineDef[] = [];
  let sampleFactorValues: number[] = [];

  const maxLayers = 6;
  const offsetMultiplier = 0.009;
  const offsetExponent = 1.7;

  let hoverProgress = 0;
  let hoverT = 0;
  const hoverSpeed = 0.03;
  let hoverExtraLayers = 17;
  let mobileIdlePulseEnabled = false;
  let mobilePulsePhase = 0;

  let refWidth = 1600;
  let refHeight = 900;
  let currentLayout = "";

  let myShader: p5.Shader | null = null;
  let canvasLayer: p5.Graphics | null = null;

  function randomizeSampleFactorValues() {
    sampleFactorValues = [
      p.random(0.06, 0.12),
      p.random(0.12, 0.2),
      p.random(0.2, 0.3),
      p.random(0.3, 0.4),
      p.random(0.4, 0.55),
    ];
  }

  /** Extra horizontal gap after each glyph (letter-spacing). */
  function letterTracking() {
    return fontSize * (currentLayout === "mobile" ? 0.052 : 0.085);
  }

  /** Extra width for space characters so word gaps (e.g. Algo World) read clearly. */
  function wordSpaceExtra() {
    return fontSize * (currentLayout === "mobile" ? 0.14 : 0.22);
  }

  /** Shrink font until every line fits in ref width and the stack fits in ref height. */
  function fitFontSizeToRef() {
    if (!fontPoints) return;
    const minFs = currentLayout === "mobile" ? 100 : 148;
    const maxW = refWidth * 0.86;
    const maxH = refHeight * 0.8;
    p.textFont(fontPoints);
    while (fontSize > minFs) {
      p.textSize(fontSize);
      const lh = fontSize * 1.22;
      let maxLineW = 0;
      for (const line of lines) {
        maxLineW = Math.max(maxLineW, getKernedTextWidth(line.text));
      }
      const stackH = lines.length * lh + fontSize * 0.9;
      if (maxLineW <= maxW && stackH <= maxH) break;
      fontSize -= 3;
    }
    p.textSize(fontSize);
  }

  /** Move all glyph points so the blob is centred in the ref rectangle. */
  function centerPointCloudInRef() {
    if (allPoints.length === 0) return;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const pt of allPoints) {
      minX = Math.min(minX, pt.x);
      maxX = Math.max(maxX, pt.x);
      minY = Math.min(minY, pt.y);
      maxY = Math.max(maxY, pt.y);
    }
    const pad = fontSize * 0.2;
    minX -= pad;
    maxX += pad;
    minY -= pad;
    maxY += pad;
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const dx = refWidth / 2 - cx;
    const dy = refHeight / 2 - cy;
    for (const pt of allPoints) {
      pt.x += dx;
      pt.y += dy;
    }
  }

  function buildTextLayout() {
    if (!fontPoints) return;
    p.textFont(fontPoints);
    p.textSize(fontSize);
    allPoints = [];
    const lineHeight = fontSize * 1.22;
    const firstBaseline = fontSize * 0.92;
    const track = letterTracking();

    let lineIdx = 0;
    for (const line of lines) {
      const lineWidth = getKernedTextWidth(line.text);
      line.x = (refWidth - lineWidth) / 2;
      line.y = firstBaseline + lineIdx * lineHeight;
      lineIdx++;
    }

    /* Larger = fewer points per letter → less muddy overlap between adjacent glyphs. */
    const minDistanceSq = currentLayout === "mobile" ? 14 : 10;
    let charGlobalIndex = 0;

    for (const line of lines) {
      let currentX = line.x ?? 0;

      for (let i = 0; i < line.text.length; i++) {
        const char = line.text[i]!;
        if (char === " ") {
          currentX += p.textWidth(char) + wordSpaceExtra() + track;
          continue;
        }

        const randomSF = p.random(sampleFactorValues);
        const growthFactor = p.random(0.5, 2.0);
        p.textSize(fontSize);
        const rawPoints = fontPoints.textToPoints(char, currentX, line.y!, {
          sampleFactor: randomSF,
        }) as { x: number; y: number }[];

        const filteredPoints: { x: number; y: number }[] = [];
        for (const pt of rawPoints) {
          let isTooClose = false;
          for (const accepted of filteredPoints) {
            const dx = pt.x - accepted.x;
            const dy = pt.y - accepted.y;
            if (dx * dx + dy * dy < minDistanceSq) {
              isTooClose = true;
              break;
            }
          }
          if (!isTooClose) filteredPoints.push(pt);
        }

        let centerX = 0;
        let centerY = 0;
        for (const pt of filteredPoints) {
          centerX += pt.x;
          centerY += pt.y;
        }
        if (filteredPoints.length > 0) {
          centerX /= filteredPoints.length;
          centerY /= filteredPoints.length;
        }

        for (const pt of filteredPoints) {
          const dx = pt.x - centerX;
          const dy = pt.y - centerY;
          const dist = Math.hypot(dx, dy) || 1;
          allPoints.push({
            x: pt.x,
            y: pt.y,
            factor: growthFactor,
            letterIndex: charGlobalIndex,
            nx: dx / dist,
            ny: dy / dist,
          });
        }
        charGlobalIndex++;

        currentX += p.textWidth(char) + track;
      }
    }

    centerPointCloudInRef();
  }

  function getKernedTextWidth(textValue: string) {
    const track = letterTracking();
    let widthValue = 0;
    for (let i = 0; i < textValue.length; i++) {
      const char = textValue[i]!;
      if (char === " ") {
        widthValue += p.textWidth(char) + wordSpaceExtra() + track;
      } else {
        widthValue += p.textWidth(char) + track;
      }
    }
    return widthValue;
  }

  function checkLayoutAndBuild() {
    const newLayout = p.width < 800 ? "mobile" : "desktop";

    if (newLayout !== currentLayout) {
      currentLayout = newLayout;

      if (currentLayout === "mobile") {
        mobileIdlePulseEnabled = true;
        mobilePulsePhase = 0;
        refWidth = 960;
        refHeight = 1500;
        lines = [
          { text: "Exploring" },
          { text: "the" },
          { text: "Algo" },
          { text: "World" },
        ];
        layoutTargetFontSize = 198;
        fontSize = layoutTargetFontSize;
        hoverExtraLayers = 20;
      } else {
        mobileIdlePulseEnabled = false;
        refWidth = 1600;
        refHeight = 900;
        lines = [{ text: "Exploring the" }, { text: "Algo World" }];
        layoutTargetFontSize = 252;
        fontSize = layoutTargetFontSize;
        hoverExtraLayers = 17;
      }

      p.textFont(fontPoints!);
      p.textSize(fontSize);
      fitFontSizeToRef();
      buildTextLayout();
    }
  }

  function rerandomizeTypography() {
    randomizeSampleFactorValues();
    buildTextLayout();
  }

  function ensureGraphicsSize() {
    if (!canvasLayer) return;
    if (canvasLayer.width !== p.width || canvasLayer.height !== p.height) {
      canvasLayer.resizeCanvas(p.width, p.height);
    }
  }

  p.setup = () => {
    const container = (p as unknown as { canvas?: HTMLCanvasElement }).canvas
      ?.parentElement as HTMLDivElement | null;
    const cw = container?.offsetWidth ?? 0;
    const ch = container?.offsetHeight ?? 0;
    const w = cw > 0 ? cw : Math.max(400, Math.min(800, p.windowWidth));
    const h = ch > 0 ? ch : Math.max(240, Math.min(400, p.windowHeight));

    p.createCanvas(w, h, p.WEBGL);
    p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));

    canvasLayer = p.createGraphics(w, h);
    canvasLayer.pixelDensity(2);

    canvasLayer.strokeWeight(2);
    canvasLayer.noFill();
    randomizeSampleFactorValues();

    try {
      myShader = p.createShader(vertSrc, fragSrc);
    } catch (e) {
      console.error("algoTitleSketch: shader compile failed", e);
    }

    p.loadFont(
      FONT_PRIMARY,
      (f) => {
        fontPoints = f;
        p.textFont(fontPoints);
        p.rectMode(p.CENTER);
        checkLayoutAndBuild();
      },
      () => {
        p.loadFont(
          FONT_FALLBACK,
          (f) => {
            fontPoints = f;
            p.textFont(fontPoints);
            p.rectMode(p.CENTER);
            checkLayoutAndBuild();
          },
          (err: unknown) =>
            console.error("algoTitleSketch: font load failed", err),
        );
      },
    );
  };

  (p as unknown as { windowResized?: () => void }).windowResized = () => {
    if (!fontPoints) return;
    fontSize = layoutTargetFontSize;
    p.textFont(fontPoints);
    p.textSize(fontSize);
    fitFontSizeToRef();
    buildTextLayout();
  };

  p.mousePressed = () => {
    rerandomizeTypography();
  };

  (p as unknown as { touchStarted?: () => boolean }).touchStarted = () => {
    if (currentLayout === "mobile") {
      mobileIdlePulseEnabled = false;
    }
    rerandomizeTypography();
    return false;
  };

  p.draw = () => {
    if (!fontPoints || !canvasLayer || !myShader) {
      p.background(255);
      return;
    }

    checkLayoutAndBuild();
    ensureGraphicsSize();

    canvasLayer.background(255);
    canvasLayer.push();
    canvasLayer.translate(p.width / 2, p.height / 2);

    /* Always ≤1: entire ref (with centred text) fits inside the canvas — no overflow clip. */
    const scalePadding = currentLayout === "mobile" ? 0.94 : 0.96;
    const scaleFactor =
      p.min(p.width / refWidth, p.height / refHeight) * scalePadding;
    canvasLayer.scale(scaleFactor);
    canvasLayer.translate(-refWidth / 2, -refHeight / 2);

    let controlX = currentLayout === "mobile" ? p.width * 0.5 : p.mouseX;
    let controlY = currentLayout === "mobile" ? p.height * 0.5 : p.mouseY;
    if (currentLayout === "mobile" && p.touches.length > 0) {
      const t = p.touches[0] as { x: number; y: number };
      controlX = t.x;
      controlY = t.y;
    }

    const isMobileHold = currentLayout === "mobile" && p.touches.length > 0;
    const { isPlayButtonHovered } = getProps();
    const isHovered = isPlayButtonHovered || isMobileHold;

    let pulseHover = 0;
    let pulseScale = 1;
    if (currentLayout === "mobile" && mobileIdlePulseEnabled && !isMobileHold) {
      mobilePulsePhase += 0.07;
      const pulse = (p.sin(mobilePulsePhase) + 1) * 0.5;
      pulseHover = p.lerp(0.08, 0.35, pulse);
      pulseScale = p.lerp(0.86, 1.18, pulse);
    }

    if (isHovered) hoverT += hoverSpeed;
    else hoverT -= hoverSpeed;
    hoverT = p.constrain(hoverT, 0, 1);
    if (pulseHover > 0) {
      hoverT = p.max(hoverT, pulseHover);
    }
    hoverProgress = hoverT * hoverT;

    const baseSize = p.map(controlX, 0, p.width, 2, 8) * pulseScale;
    const baseLayers = p.map(controlX, 0, p.width, 1, maxLayers);
    const continuousLayers = baseLayers + hoverProgress * hoverExtraLayers;
    const pointSizeScale = p.map(controlY, 0, p.height, 0.5, 2.5) * pulseScale;
    const hoverMultiplier = p.lerp(1, 2.5, hoverProgress);

    const totalMaxLayers = p.floor(continuousLayers);
    const black = p.color(0);
    const white = p.color(255);
    const cpColors = cp.map((c) => p.color(c));

    canvasLayer.noStroke();

    let performanceStride = 1;
    if (currentLayout === "mobile") {
      if (pointSizeScale > 5) performanceStride = 1;
      if (totalMaxLayers > 12) performanceStride *= 1;
    }

    for (let i = totalMaxLayers - 1; i >= 0; i--) {
      const layerVisibility = p.constrain(continuousLayers - i, 0, 1);
      if (layerVisibility <= 0) continue;

      const depthFactor = p.map(i, 0, totalMaxLayers, 1.2, 0.2);
      const iPow = p.pow(i, offsetExponent);
      const combinedSize =
        baseSize *
        (1 + iPow * offsetMultiplier) *
        pointSizeScale *
        layerVisibility;
      const combinedOffset = iPow * 0.25 * hoverMultiplier;

      const currentLayerColors = cpColors.map((c) => {
        const shaded = p.lerpColor(black, c, depthFactor);
        return i === 0 ? p.lerpColor(c, white, 0.2) : shaded;
      });

      for (let j = 0; j < allPoints.length; j += performanceStride) {
        const pt = allPoints[j]!;
        canvasLayer.fill(
          currentLayerColors[pt.letterIndex % currentLayerColors.length]!,
        );

        const finalSize = p.max(combinedSize * pt.factor, 1.5);
        canvasLayer.ellipse(
          pt.x + pt.nx * combinedOffset,
          pt.y + pt.ny * combinedOffset,
          finalSize,
          finalSize,
        );
      }
    }
    canvasLayer.pop();

    p.background(255);
    p.shader(myShader);
    myShader.setUniform("tex0", canvasLayer);
    myShader.setUniform("texelSize", [1.0 / p.width, 1.0 / p.height]);
    myShader.setUniform("uTime", p.millis() / 1000.0);
    p.rect(-p.width / 2, -p.height / 2, p.width, p.height);
  };
};
