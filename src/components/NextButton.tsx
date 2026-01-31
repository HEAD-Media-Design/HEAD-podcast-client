import React from "react";

interface NextButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

const NextButton: React.FC<NextButtonProps> = ({
  onClick,
  ariaLabel = "Next podcast",
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
          x1="51"
          y1="4"
          x2="51"
          y2="48"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <path d="M52 26L13 48.52L13 3.48L52 26Z" fill="currentColor" />
      </svg>
    </button>
  );
};

export default NextButton;
