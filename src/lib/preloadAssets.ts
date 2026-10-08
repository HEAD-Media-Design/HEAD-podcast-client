/** SF Pro Display Medium, subset to basic Latin (~16 KB), drawn by the idle title sketch. */
export const TITLE_FONT_URL = "/fonts/SF-Pro-Display-Medium-latin.otf";

let titleFontPromise: Promise<void> | null = null;

/**
 * Downloads the title sketch's font once so it is in the HTTP cache before the shell opens;
 * the sketch's own `loadFont` / `opentype.load` then resolve from cache.
 */
export function preloadTitleFont(): Promise<void> {
  titleFontPromise ??= fetch(TITLE_FONT_URL)
    .then((res) => res.arrayBuffer())
    .then(() => undefined);
  return titleFontPromise;
}
