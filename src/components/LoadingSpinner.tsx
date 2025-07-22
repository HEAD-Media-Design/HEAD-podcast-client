import React from "react";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-black">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
