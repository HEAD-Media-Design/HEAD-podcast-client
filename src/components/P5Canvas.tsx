import { useEffect, useRef } from "react";

import type { P5Sketch } from "../types/p5Sketch";
import p5 from "p5";

export interface P5CanvasProps<T> {
  /**
   * Your p5 sketch. Receives (p5 instance, getProps).
   * Call getProps() in draw() to read current props.
   */
  sketch: P5Sketch<T>;
  /**
   * Props passed to the sketch. Read them in the sketch via getProps().
   */
  props: T;
  className?: string;
}

/**
 * Reusable p5.js canvas. Mounts your sketch in a div and handles resize/unmount.
 * Swap the `sketch` prop to use your own p5 code.
 */
function P5Canvas<T>({ sketch, props, className }: P5CanvasProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    let p5Instance: p5 | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const container = containerRef.current;
    if (!container) return;

    const getProps = () => propsRef.current;
    const sketchWithProps = (p: p5) => sketch(p, getProps);
    p5Instance = new p5(sketchWithProps, container);

    resizeObserver = new ResizeObserver(() => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (w > 0 && h > 0) p5Instance?.resizeCanvas(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver?.disconnect();
      p5Instance?.remove();
    };
  }, [sketch]);

  return <div ref={containerRef} className={className} />;
}

export default P5Canvas;
