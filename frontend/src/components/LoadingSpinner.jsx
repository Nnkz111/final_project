import React from "react";

const LoadingSpinner = () => (
  <div className="flex flex-col justify-center items-center py-8">
    <div className="animate-spin rounded-full h-16 w-16 border-gray-200 border-t-4 border-t-gray-800"></div>
    <div className="mt-4 text-gray-600 text-lg font-medium">Loading...</div>
  </div>
);

export default LoadingSpinner;
