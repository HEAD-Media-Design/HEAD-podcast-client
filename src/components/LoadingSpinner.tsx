import React from "react";

import { SupernovaLogo } from "./SupernovaLogo";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center" role="status" aria-live="polite">
        <SupernovaLogo
          className="mx-auto mb-6 aspect-[117/120] w-[min(117px,70vw)]"
          spinning
        />
        <p className="text-black font-spline-sans">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
