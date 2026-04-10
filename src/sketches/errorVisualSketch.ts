import opentype from "opentype.js";

import type { P5Sketch } from "../types/p5Sketch";

/** Spline Sans Medium — same face family as the original `assets/SplineSans-Medium.ttf`. */
const FONT_URL =
  "https://cdn.jsdelivr.net/gh/SorkinType/SplineSans@main/fonts/ttf/SplineSans-Medium.ttf";

const TEXT_STRING = "Error!";

export type ErrorSketchProps = Record<string, never>;

/**
 * Instance-mode port of the attached sketch: setup/draw/windowResized and the per-iteration
 * `j <= random(200)` ellipse loop. Font loads in `setup` — p5 v2 disables `preload` by default
 * (`isPreloadSupported() === false`) and throws if `preload` is defined on the instance.
 */
export const errorVisualSketch: P5Sketch<ErrorSketchProps> = (p) => {
  let font: opentype.Font | null = null;
  const maxFontSize = 120;
  let currentFontSize = maxFontSize;

  /** Original used `windowWidth`; here `p.width` matches the canvas (parent may be narrower than the window). */
  const updateFontSize = () => {
    const scaleFactor = p.min(1, p.width / 800);
    currentFontSize = maxFontSize * scaleFactor;
    p.textSize(currentFontSize);
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    updateFontSize();
    p.ellipseMode(p.CENTER);
    p.frameRate(5);
    opentype.load(FONT_URL, (err, f) => {
      if (err) {
        console.error("Error loading font:", err);
      } else if (f) {
        font = f;
        console.log("Font loaded!");
      }
    });
  };

  p.windowResized = () => {
    // Parent container also calls resizeCanvas; keep original hook for font scaling.
    updateFontSize();
  };

  p.draw = () => {
    p.background(255);
    // Original relied on `windowResized`; embedded canvas is resized by the parent without that event.
    updateFontSize();
    if (!font) return;

    const fontSize = currentFontSize;

    let totalWidth = 0;
    for (let i = 0; i < TEXT_STRING.length; i++) {
      const glyph = font.charToGlyph(TEXT_STRING[i]!);
      totalWidth += glyph.advanceWidth! * (fontSize / font.unitsPerEm);
      if (i < TEXT_STRING.length - 1) {
        const nextGlyph = font.charToGlyph(TEXT_STRING[i + 1]!);
        const kerningValue = font.getKerningValue(glyph, nextGlyph);
        totalWidth += kerningValue * (fontSize / font.unitsPerEm);
      }
    }

    let x = (p.width - totalWidth) / 2;
    const y = p.height / 2 + fontSize / 3;

    for (let i = 0; i < TEXT_STRING.length; i++) {
      const char = TEXT_STRING[i]!;
      const glyph = font.charToGlyph(char);
      const path = glyph.getPath(x, y, fontSize);
      const bbox = path.getBoundingBox();

      const centerX = (bbox.x1 + bbox.x2) / 2;
      const centerY = (bbox.y1 + bbox.y2) / 2;

      const baseW = bbox.x2 - bbox.x1;
      const baseH = bbox.y2 - bbox.y1;

      p.noFill();
      p.strokeWeight(1);
      p.stroke("#ef001c");
      p.rectMode(p.CENTER);

      // Original: condition re-evaluates `random(200)` every iteration (not a fixed cap).
      for (let j = 1; j <= p.random(200); j++) {
        const scale = j * 0.1;
        const w = baseW * scale;
        const h = baseH * scale;
        p.ellipse(centerX, centerY, w, h);
      }

      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.save();
      ctx.strokeStyle = "rgb(0, 0, 0)";
      ctx.lineWidth = 2;
      path.draw(ctx);
      ctx.stroke();
      ctx.restore();

      let advance = glyph.advanceWidth! * (fontSize / font.unitsPerEm);

      if (i < TEXT_STRING.length - 1) {
        const nextGlyph = font.charToGlyph(TEXT_STRING[i + 1]!);
        const kerningValue = font.getKerningValue(glyph, nextGlyph);
        advance += kerningValue * (fontSize / font.unitsPerEm);
      }

      x += advance;
    }
  };
};
