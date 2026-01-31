# p5 Sketches

This folder contains p5.js sketches used by `P5Canvas`.

## Using your own sketch

1. **Add a new sketch file**  
   Create a sketch with the signature `(p, getProps) => void` under `src/sketches/`.

2. **Define props type**  
   Define the type for values you read via `getProps()` (e.g. `audioLevel`) and use `P5Sketch<YourProps>`.

3. **Use it in PodcastMainContent**  
   In `PodcastMainContent.tsx`, import your sketch instead of `audioReactiveSketch` and pass it to `P5Canvas`.

```ts
// src/sketches/mySketch.ts
import type { P5Sketch } from "../types/p5Sketch";

export interface MySketchProps {
  audioLevel: number;
}

export const mySketch: P5Sketch<MySketchProps> = (p, getProps) => {
  p.setup = () => {
    p.createCanvas(400, 400);
  };
  p.draw = () => {
    const { audioLevel } = getProps();
    // ...
  };
};
```

```tsx
// PodcastMainContent.tsx
import { mySketch } from "../sketches/mySketch";
// ...
<P5Canvas sketch={mySketch} props={{ audioLevel }} className="w-full h-full" />;
```

## Audio level

`audioLevel` (0–1) is computed in `App` with the Web Audio API and passed down: `App` → `PodcastMainContent` → `P5Canvas` → `getProps()`. In your sketch, read it with `getProps().audioLevel`.
