import React from "react";
import StatCard from "./StatCard";
import SalesAnalytic from "./SalesAnalytic";
import TopSellingProducts from "./TopSellingProducts";

function AdminDashboard() {
  // Dummy data based on the image
  const stats = [
    {
      title: "Total Revenue",
      value: "$82,650",
      icon: "dollar", // Placeholder for icon type
      trendPercentage: 11,
      trendDirection: "up",
    },
    {
      title: "Total Order",
      value: "1645",
      icon: "cart", // Placeholder
      trendPercentage: 11,
      trendDirection: "up",
    },
    {
      title: "Total Customer",
      value: "1,462",
      icon: "user", // Placeholder
      trendPercentage: 17,
      trendDirection: "down",
    },
    {
      title: "Pending Delivery",
      value: "117",
      icon: "delivery", // Placeholder
      trendPercentage: 1,
      trendDirection: "up",
    },
  ];

  return (
    <div className="p-4">
      {" "}
      {/* Add padding to the dashboard content */}
      {/* Overview Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {" "}
        {/* Responsive grid for stats */}
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon} // Pass icon prop
            trendPercentage={stat.trendPercentage}
            trendDirection={stat.trendDirection}
          />
        ))}
      </div>
      {/* Sales Analytic Section */}
      <SalesAnalytic />
      {/* Top Selling Products Section */}
      <TopSellingProducts />
      {/* Add other sections like Sales Target, Current Offer, etc. here */}
    </div>
  );
}

export default AdminDashboard;
