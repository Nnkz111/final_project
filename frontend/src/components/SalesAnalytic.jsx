import React from "react";

function SalesAnalytic() {
  // Dummy data for metrics based on the image
  const income = { value: "23,262.00", percentage: 0.05, direction: "up" };
  const expenses = { value: "11,135.00", percentage: 0.05, direction: "up" };
  const balance = { value: "48,135.00", percentage: 0.05, direction: "up" };

  const Trend = ({ percentage, direction }) => {
    const trendColor = direction === "up" ? "text-green-500" : "text-red-500";
    const arrowIcon = direction === "up" ? "▲" : "▼";
    return (
      <span className={`text-xs font-semibold ${trendColor}`}>
        {arrowIcon}
        {percentage}%
      </span>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-6">
      {" "}
      {/* Section container */}
      <h3 className="text-lg font-semibold text-gray-800">Sales Analytic</h3>
      {/* Metrics and Sort By */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex space-x-6">
          {" "}
          {/* Metrics */}
          <div>
            <p className="text-gray-600">Income</p>
            <p className="text-gray-900 text-xl font-semibold">
              {income.value} <Trend {...income} />
            </p>
          </div>
          <div>
            <p className="text-gray-600">Expenses</p>
            <p className="text-gray-900 text-xl font-semibold">
              {expenses.value} <Trend {...expenses} />
            </p>
          </div>
          <div>
            <p className="text-600">Balance</p>
            <p className="text-gray-900 text-xl font-semibold">
              {balance.value} <Trend {...balance} />
            </p>
          </div>
        </div>

        {/* Sort By Placeholder */}
        <div className="text-sm text-gray-600">
          Sort by{" "}
          <select className="ml-1 border rounded-md px-2 py-1">
            <option>Jul 2023</option>
          </select>
        </div>
      </div>
      {/* Chart Placeholder */}
      <div className="mt-6 h-64 bg-gray-200 flex items-center justify-center text-gray-600">
        {" "}
        {/* Placeholder for chart */}
        Sales Analytic Chart Placeholder
      </div>
    </div>
  );
}

export default SalesAnalytic;
