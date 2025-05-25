import React, { useEffect, useState } from "react";
import StatCard from "./StatCard";
import SalesAnalytic from "./SalesAnalytic";
import TopSellingProducts from "./TopSellingProducts";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/stats");
        const data = await res.json();
        // Removed separate fetch for pending orders, now included in /api/admin/stats
        setStats({
          ...data,
          loading: false,
        });
      } catch (err) {
        console.error("Error fetching admin stats:", err); // Log error for debugging
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Revenue",
      value: stats.loading ? "..." : `$${stats.totalSales.toLocaleString()}`,
      icon: "dollar",
    },
    {
      title: "Total Orders",
      value: stats.loading ? "..." : stats.totalOrders,
      icon: "cart",
    },
    {
      title: "Total Customers",
      value: stats.loading ? "..." : stats.totalCustomers,
      icon: "user",
    },
    {
      title: "Total Products",
      value: stats.loading ? "..." : stats.totalProducts,
      icon: "box",
    },
    {
      title: "Pending Orders",
      value: stats.loading ? "..." : stats.pendingOrders,
      icon: "clock",
    },
  ];

  return (
    <div className="p-4">
      {" "}
      {/* Add padding to the dashboard content */}
      {/* Overview Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {" "}
        {/* Responsive grid for stats */}
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
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
