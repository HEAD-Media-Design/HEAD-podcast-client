import React from "react";

import { SupernovaLogo } from "./SupernovaLogo";

interface HeaderProps {
  onInfoClick: () => void;
  isInfoOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onInfoClick, isInfoOpen }) => {
  return (
    <div className="flex max-h-[71px] min-h-[71px] max-w-full flex-col overflow-hidden border-black border-b-[3px] p-0 py-0 md:max-h-none md:min-h-0 md:h-[160px] md:overflow-x-hidden md:overflow-y-visible md:border-b-[5px] md:px-[25px]">
      {/* Desktop */}
      <div className="relative hidden min-h-0 w-full min-w-0 flex-1 flex-col md:flex">
        <button
          type="button"
          className="absolute top-0 right-0 mb-2 ml-auto w-fit shrink-0 cursor-pointer bg-black px-3 py-1 pl-[calc(12px+5.4px)] font-spline-sans-mono text-[18px] font-semibold leading-[18px] tracking-[5.4px] text-white"
          onClick={onInfoClick}
          aria-expanded={isInfoOpen}
          aria-label={isInfoOpen ? "Close information" : "Open information"}
        >
          {isInfoOpen ? "CLOSE" : "INFO"}
        </button>
        <div className="mt-[15px] flex min-w-0 w-full flex-nowrap items-center whitespace-nowrap">
          <span className="shrink-0 text-[#000] font-spline-sans text-[70px] not-italic font-semibold leading-none tracking-[-2.1px] lg:text-[116px] lg:tracking-[-3.48px]">
            Supernova
          </span>
          <div className="flex shrink-0 items-center justify-center">
            <SupernovaLogo className="aspect-[117/120] h-[72px] w-auto shrink-0 lg:h-[120px] lg:w-[117px]" />
          </div>
          <div className="flex shrink-0 items-baseline gap-2 pl-2">
            <span className="text-[#000] font-spline-sans text-[70px] not-italic font-semibold leading-none tracking-[-2.1px] lg:text-[116px] lg:tracking-[-3.48px]">
              Podcast
            </span>
            <p className="text-left text-[#000] font-spline-sans text-[20px] sm:text-[25px] not-italic font-semibold leading-none tracking-[0.2px] md:text-[28px] lg:tracking-[0.33px] 2xl:text-[33px]">
              by HEAD Media Design
            </p>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="relative flex min-h-0 w-full flex-1 items-center justify-between gap-2 md:hidden">
        <div className="flex min-w-0 w-full flex-1 flex-col justify-center ml-2">
          <span className="text-left font-spline-sans text-[34px] not-italic font-semibold leading-[28px] tracking-[-0.68px] text-black">
            Supernova
          </span>
          <span className="mt-1 text-left font-spline-sans text-[34px] not-italic font-semibold leading-[28px] tracking-[-0.68px] text-black">
            Podcast
          </span>
        </div>
        <div className="flex h-[65px] w-[64px] items-center justify-center absolute right-35">
          <SupernovaLogo className="h-full w-full max-h-full max-w-full object-contain" />
        </div>
        <div className="flex flex-1 max-w-fit items-center justify-end">
          <button
            type="button"
            className="inline-flex shrink-0 cursor-pointer items-center justify-center bg-black px-2 py-1 font-spline-sans-mono text-[18px] font-semibold leading-[18px] tracking-[5.4px] text-white md:px-3"
            onClick={onInfoClick}
            aria-expanded={isInfoOpen}
            aria-label={isInfoOpen ? "Close information" : "Open information"}
          >
            {isInfoOpen ? "CLOSE" : "INFO"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;
