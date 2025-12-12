import React from "react";

interface HeaderProps {
  onInfoClick: () => void;
  isInfoOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onInfoClick, isInfoOpen }) => {
  return (
    <div className="border-b border-black border-b-[3px] md:border-b-[5px] p-0 md:p-7 py-0 md:py-0 h-[71px] md:h-[203px]">
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-col">
        <button
          className="bg-black text-white px-3 py-1 pl-[calc(12px+5.4px)] ml-auto w-fit cursor-pointer font-spline-sans-mono text-[18px] font-semibold leading-[18px] tracking-[5.4px] flex items-center justify-center"
          onClick={onInfoClick}
        >
          {isInfoOpen ? "CLOSE" : "INFO"}
        </button>
        <div className="flex items-center">
          <span className="text-black font-executive">HEAD</span>
          <div className="bg-black h-4 mx-4 flex-1"></div>
          <span className="text-black font-executive">Podcasts</span>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex items-center justify-between h-full">
        <div className="flex flex-col p-2">
          <div className="flex items-center">
            <div className="w-8 h-1 bg-black mr-2"></div>
            <span className="text-black font-executive">HEAD</span>
          </div>
          <span className="text-black font-executive mt-1">Podcasts</span>
        </div>
        <button
          className="bg-black text-white px-3 py-1 pl-[calc(12px+5.4px)] font-spline-sans-mono text-[18px] font-semibold leading-[18px] tracking-[5.4px] cursor-pointer "
          onClick={onInfoClick}
        >
          {isInfoOpen ? "CLOSE" : "INFO"}
        </button>
      </div>
    </div>
  );
};

export default Header;
