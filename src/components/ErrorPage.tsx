import { useState } from "react";
import { Link } from "react-router-dom";

import { EPISODES } from "../data/episodes";
import {
  errorVisualSketch,
  type ErrorSketchProps,
} from "../sketches/errorVisualSketch";
import Header from "./Header";
import InfoModal from "./InfoModal";
import P5Canvas from "./P5Canvas";

export interface ErrorPageProps {
  /** Optional detail under the default subtitle (e.g. load error). */
  detail?: string;
}

const errorSketchProps: ErrorSketchProps = {};

/**
 * Full-viewport error / 404 layout: site header, p5 “Error!” sketch (left), copy + GO HOME (right).
 */
function ErrorPage({ detail }: ErrorPageProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const homePath = EPISODES.length > 0 ? `/episode/${EPISODES[0]!.slug}` : "/";

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-white text-black">
      <Header
        onInfoClick={() => setIsInfoOpen((open) => !open)}
        isInfoOpen={isInfoOpen}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
        {/* min-w-0 + overflow-hidden: p5 canvas has huge intrinsic width — without this, flex eats the right column */}
        <div className="flex min-h-[min(42vh,280px)] min-w-0 flex-1 items-center justify-center overflow-hidden border-b-3 border-black md:min-h-0 md:border-b-0 md:border-r-5 md:border-black">
          <P5Canvas
            sketch={errorVisualSketch}
            props={errorSketchProps}
            className="h-full min-h-[200px] min-w-0 w-full [&_canvas]:block [&_canvas]:h-full [&_canvas]:max-h-full [&_canvas]:max-w-full [&_canvas]:w-full"
          />
        </div>

        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-6 px-8 py-12 text-center md:px-12">
          <div className="max-w-md">
            <h1 className="font-spline-sans text-[48px] md:text-[72px] font-semibold leading-tight tracking-tight text-black">
              Looks like you're lost.
            </h1>
            <p className="mt-4 font-spline-sans text-[24px] md:text-[32px] font-normal leading-snug text-black">
              The page you're looking for doesn't exist
            </p>
            {detail ? (
              <p className="mt-3 font-spline-sans text-sm leading-relaxed text-black/70">
                {detail}
              </p>
            ) : null}
          </div>
          <Link
            to={homePath}
            replace
            className="inline-block border-[5px] border-black bg-white px-8 py-3 font-spline-sans-mono text-[20px] md:text-[28px] font-semibold uppercase tracking-[0.2em] text-black transition-colors hover:bg-black hover:text-white"
          >
            GO HOME
          </Link>
        </div>
      </div>

      {isInfoOpen ? <InfoModal /> : null}
    </div>
  );
}

export default ErrorPage;
