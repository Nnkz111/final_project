import React, { useEffect, useState } from "react";
import StatCard from "./StatCard";
import SalesAnalytic from "./SalesAnalytic";
import TopSellingProducts from "./TopSellingProducts";
import { useTranslation } from "react-i18next";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSales: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    loading: true,
  });

  const { t } = useTranslation(); // Initialize translation hook

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${API_URL}/api/admin/stats`);
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
      title: t("admin_dashboard.total_revenue"),
      value: stats.loading
        ? "..."
        : stats.totalSales.toLocaleString("lo-LA", {
            style: "currency",
            currency: "LAK",
          }),
      icon: "dollar",
      color: "bg-blue-200",
    },
    {
      title: t("admin_dashboard.total_orders"),
      value: stats.loading ? "..." : stats.totalOrders,
      icon: "cart",
      color: "bg-green-200",
    },
    {
      title: t("admin_dashboard.total_customers"),
      value: stats.loading ? "..." : stats.totalCustomers,
      icon: "user",
      color: "bg-yellow-200",
    },
    {
      title: t("admin_dashboard.total_products"),
      value: stats.loading ? "..." : stats.totalProducts,
      icon: "box",
      color: "bg-red-200",
    },
    {
      title: t("admin_dashboard.pending_orders"),
      value: stats.loading ? "..." : stats.pendingOrders,
      icon: "clock",
      color: "bg-purple-200",
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
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
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
