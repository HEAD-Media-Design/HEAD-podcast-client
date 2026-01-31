import { useCallback, useEffect, useRef, useState } from "react";

import type { P5Sketch } from "../types/p5Sketch";
import p5 from "p5";

export interface P5CanvasProps<T> {
  sketch: P5Sketch<T>;
  props: T;
  className?: string;
}

/**
 * Mounts p5 sketch in a div. Container readiness is tracked by state so p5
 * is created/cleaned up in a single useEffect (avoids double canvas from ref callback timing).
 */
function P5Canvas<T>({ sketch, props, className }: P5CanvasProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const propsRef = useRef(props);
  const p5InstanceRef = useRef<p5 | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [containerReady, setContainerReady] = useState(false);
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
    return () => {
      ro.disconnect();
      resizeObserverRef.current = null;
      instance.remove();
      p5InstanceRef.current = null;
    };
  }, [containerReady, sketch]);

  return <div ref={setContainerRef} className={className} />;
}

export default P5Canvas;
