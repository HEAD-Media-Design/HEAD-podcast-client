import React from "react";

const EmptyState: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h3 className="text-lg font-medium text-black mb-2">
          No podcasts available
        </h3>
        <p className="text-gray-600">Check back later for new episodes.</p>
      </div>
    </div>
  );
};

export default EmptyState;
