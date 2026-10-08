import { useCallback, useEffect, useRef, useState } from "react";

import type { P5Sketch } from "../types/p5Sketch";
import p5 from "p5";

export interface P5CanvasProps<T> {
  sketch: P5Sketch<T>;
  props: T;
  className?: string;
}

function isContextLost(instance: p5): boolean {
  const ctx = (instance as unknown as { drawingContext?: unknown })
    .drawingContext as WebGLRenderingContext | undefined;
  return typeof ctx?.isContextLost === "function" && ctx.isContextLost();
}

/**
 * Mounts p5 sketch in a div. Container readiness is tracked by state so p5
 * is created/cleaned up in a single useEffect (avoids double canvas from ref callback timing).
 *
 * Mobile browsers drop WebGL contexts while the tab is backgrounded or the phone sleeps, and p5
 * can't rebuild its GL state, leaving Chrome's "sad face" placeholder. When that happens the
 * sketch is recreated (bumping `contextGeneration`) as soon as the page is visible again.
 */
function P5Canvas<T>({ sketch, props, className }: P5CanvasProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef(props);
  const p5InstanceRef = useRef<p5 | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [containerReady, setContainerReady] = useState(false);
  const [contextGeneration, setContextGeneration] = useState(0);
  propsRef.current = props;

  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
    setContainerReady(!!el);
  }, []);

  useEffect(() => {
    if (!containerReady || !containerRef.current) return;
    const el = containerRef.current;
    while (el.firstChild) el.removeChild(el.firstChild);
    const getProps = () => propsRef.current;
    const sketchWithProps = (p: p5) => sketch(p, getProps);
    let instance: p5;
    try {
      instance = new p5(sketchWithProps, el);
    } catch (err) {
      console.error("p5 init failed", err);
      return;
    }
    p5InstanceRef.current = instance;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w > 0 && h > 0) instance.resizeCanvas(w, h);
    });
    ro.observe(el);
    resizeObserverRef.current = ro;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w > 0 && h > 0) instance.resizeCanvas(w, h);

    let contextLost = false;
    const remount = () => setContextGeneration((g) => g + 1);
    const onContextLost = (e: Event) => {
      e.preventDefault(); // allow the browser to restore the context
      contextLost = true;
      if (document.visibilityState === "visible") remount();
    };
    const onPageVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (contextLost || isContextLost(instance)) remount();
    };
    // Context events don't bubble; capture them from every canvas in the container.
    el.addEventListener("webglcontextlost", onContextLost, true);
    document.addEventListener("visibilitychange", onPageVisible);
    window.addEventListener("pageshow", onPageVisible);

    return () => {
      el.removeEventListener("webglcontextlost", onContextLost, true);
      document.removeEventListener("visibilitychange", onPageVisible);
      window.removeEventListener("pageshow", onPageVisible);
      ro.disconnect();
      resizeObserverRef.current = null;
      instance.remove();
      p5InstanceRef.current = null;
    };
  }, [containerReady, sketch, contextGeneration]);

  return <div ref={setContainerRef} className={className} />;
}

export default P5Canvas;
