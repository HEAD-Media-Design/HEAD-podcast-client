import React, { useLayoutEffect, useRef } from "react";

import { SupernovaLogo } from "./SupernovaLogo";

interface HeaderProps {
  onInfoClick: () => void;
  isInfoOpen: boolean;
  /** Starburst rotation (e.g. until shell open + layout tween complete). */
  logoSpinning?: boolean;
}

/** Wide mono label; `-mr` cancels trailing `letter-spacing` after the last glyph. */
function InfoButtonLabel({ isOpen }: { isOpen: boolean }) {
  return (
    <span className="tracking-[4.5px] -mr-[4.5px] inline-block md:tracking-[5.4px] md:-mr-[5.4px]">
      {isOpen ? "CLOSE" : "INFO"}
    </span>
  );
}

/** Design size of the desktop wordmark; it only shrinks below this when the row would not fit. */
const WORDMARK_MAX_PX = 116;
const WORDMARK_MIN_PX = 40;

/**
 * Sizes the desktop wordmark so "Supernova ✳ Podcast  byline" spans exactly from the left padding
 * to the INFO button's right edge. Everything except the byline scales with `--wordmark-size`, so
 * one measurement at a known size gives the size that fills the row.
 */
function useFitWordmark() {
  const rowRef = useRef<HTMLDivElement>(null);
  const scalingRef = useRef<HTMLDivElement>(null);
  const bylineRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const scaling = scalingRef.current;
    const byline = bylineRef.current;
    if (!row || !scaling || !byline) return;

    const fit = () => {
      const avail = row.clientWidth;
      if (avail === 0) return; // desktop lockup hidden below lg
      const probe = 100;
      row.style.setProperty("--wordmark-size", `${probe}px`);
      const scalingW = scaling.getBoundingClientRect().width;
      const fixedW = byline.getBoundingClientRect().width;
      const size = (probe * (avail - fixedW)) / scalingW;
      row.style.setProperty(
        "--wordmark-size",
        `${Math.max(WORDMARK_MIN_PX, Math.min(WORDMARK_MAX_PX, size))}px`,
      );
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(row);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, []);

  return { rowRef, scalingRef, bylineRef };
}

const Header: React.FC<HeaderProps> = ({
  onInfoClick,
  isInfoOpen,
  logoSpinning = false,
}) => {
  const { rowRef, scalingRef, bylineRef } = useFitWordmark();

  return (
    <div className="flex max-h-[71px] min-h-[71px] max-w-full flex-col overflow-hidden border-black border-b-[3px] p-0 py-0 md:max-h-none md:min-h-0 md:h-[160px] md:border-b-[5px] md:px-[25px]">
      {/* Desktop */}
      <div className="relative hidden min-h-0 w-full min-w-0 flex-1 flex-col lg:flex">
        <button
          type="button"
          className="absolute top-0 right-0 ml-auto inline-flex min-h-[36px] w-[91px] shrink-0 cursor-pointer items-center justify-center bg-black px-1 py-1 font-spline-sans-mono text-[18px] font-semibold leading-[18px] text-white"
          onClick={onInfoClick}
          aria-expanded={isInfoOpen}
          aria-label={isInfoOpen ? "Close information" : "Open information"}
        >
          <InfoButtonLabel isOpen={isInfoOpen} />
        </button>
        <div
          ref={rowRef}
          className="mt-[15px] flex min-w-0 w-full flex-nowrap items-baseline whitespace-nowrap [--wordmark-size:min(7.8vw,116px)]"
        >
          {/* Scales with --wordmark-size; the byline keeps its own size. */}
          <div ref={scalingRef} className="flex shrink-0 items-center">
            <span className="shrink-0 text-[#000] font-spline-sans text-(length:--wordmark-size) not-italic font-semibold leading-none tracking-[-0.03em]">
              Supernova
            </span>
            <div className="flex shrink-0 items-center justify-center px-[calc(var(--wordmark-size)*0.035)]">
              <SupernovaLogo
                spinning={logoSpinning}
                className="aspect-[117/120] h-[calc(var(--wordmark-size)*1.034)] w-auto shrink-0"
              />
            </div>
            <span className="shrink-0 text-[#000] font-spline-sans text-(length:--wordmark-size) not-italic font-semibold leading-none tracking-[-0.03em]">
              Podcast
            </span>
          </div>
          <p
            ref={bylineRef}
            className="ml-auto shrink-0 pl-3 text-left text-[#000] font-spline-sans text-[33px] not-italic font-semibold leading-none tracking-[0.33px]"
          >
            {/* Landscape tablets don't have room for the full byline. */}
            <span className="min-[1400px]:hidden">by HEAD MD</span>
            <span className="hidden min-[1400px]:inline">
              by HEAD Media Design
            </span>
          </p>
        </div>
      </div>

      {/* Mobile + portrait tablet (stacked lockup) */}
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-between gap-0.5 md:gap-2 lg:hidden">
        <div className="flex min-w-0 flex-none flex-col justify-center ml-2 md:ml-0">
          <span className="text-left font-spline-sans text-[34px] not-italic font-semibold leading-[28px] tracking-[-0.68px] text-black md:text-[66px] md:leading-[54px] md:tracking-[-1.32px]">
            Supernova
          </span>
          <span className="mt-1 text-left font-spline-sans text-[34px] not-italic font-semibold leading-[28px] tracking-[-0.68px] text-black md:mt-0 md:text-[66px] md:leading-[54px] md:tracking-[-1.32px]">
            Podcast
          </span>
        </div>
        {/* Starburst sits right against the wordmark; `mr-auto` pushes INFO to the far edge. */}
        <div className="mr-auto flex h-[65px] w-[64px] shrink-0 items-center justify-center md:h-[115px] md:w-[112px]">
          <SupernovaLogo
            spinning={logoSpinning}
            className="h-full w-full max-h-full max-w-full object-contain"
          />
        </div>
        <div className="flex flex-1 max-w-fit items-center justify-end md:max-w-none md:-mr-[25px]">
          <button
            type="button"
            className="inline-flex w-[73.5px] md:w-[110px] min-h-[20px] md:min-h-[30px] shrink-0 cursor-pointer items-center justify-center bg-black p-2 font-spline-sans-mono text-[14px] md:text-[18px] font-semibold leading-[15px] md:leading-[18px] text-white"
            onClick={onInfoClick}
            aria-expanded={isInfoOpen}
            aria-label={isInfoOpen ? "Close information" : "Open information"}
          >
            <InfoButtonLabel isOpen={isInfoOpen} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
