import type p5 from "p5";

/**
 * Sketch function signature for use with P5Canvas.
 * Use getProps() inside setup/draw to read current props (e.g. audioLevel).
 *
 * @example
 * const mySketch: P5Sketch<{ audioLevel: number }> = (p, getProps) => {
 *   p.setup = () => { p.createCanvas(400, 400); };
 *   p.draw = () => {
 *     const { audioLevel } = getProps();
 *     p.background(255);
 *     p.circle(200, 200, 50 + audioLevel * 100);
 *   };
 * };
 */
export type P5Sketch<T = Record<string, unknown>> = (
  p: p5,
  getProps: () => T,
) => void;
