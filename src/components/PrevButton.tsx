import React from "react";

interface PrevButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

const PrevButton: React.FC<PrevButtonProps> = ({
  onClick,
  ariaLabel = "Previous podcast",
  size = "md",
  className = "",
}) => {
  const sizeClasses = size === "sm" ? "w-10 h-10" : "w-12 h-12";
  const svgSize = size === "sm" ? 24 : 32;
  const strokeWidth = size === "sm" ? 8 : 10;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${sizeClasses} flex items-center justify-center text-black cursor-pointer z-10 ${className}`}
      aria-label={ariaLabel}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 56 52"
        fill="none"
        className="flex-shrink-0"
      >
        <line
          x1="5"
          y1="48"
          x2="5"
          y2="4"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <path d="M4 26L43 3.48L43 48.52L4 26Z" fill="currentColor" />
      </svg>
    </button>
  );
};

export default PrevButton;
