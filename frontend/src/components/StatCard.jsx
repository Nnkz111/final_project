import React from "react";

function StatCard({ title, value, icon, trendPercentage, trendDirection }) {
  const trendColor =
    trendDirection === "up" ? "text-green-500" : "text-red-500";
  const arrowIcon = trendDirection === "up" ? "▲" : "▼";

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between flex-1">
      {" "}
      {/* Card container */}
      <div>
        <h4 className="text-gray-500 text-sm font-medium">{title}</h4>
        <p className="text-gray-900 text-2xl font-semibold mt-1">{value}</p>
        <div className={`flex items-center text-sm mt-1 ${trendColor}`}>
          {" "}
          {/* Trend indicator */}
          <span className="mr-1">{arrowIcon}</span>
          <span>{trendPercentage}%</span>
        </div>
      </div>
      <div className="p-3 bg-gray-200 rounded-full">
        {" "}
        {/* Icon background */}
        {/* Placeholder for actual icon - using a generic SVG for now */}
        <svg
          className="h-6 w-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        {/* In a real app, you'd pass different icons via props or render prop */}
      </div>
    </div>
  );
}

export default StatCard;
