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
      title: t("admin_dashboard.total_revenue"),
      value: stats.loading ? "..." : `$${stats.totalSales.toLocaleString()}`,
      icon: "dollar",
    },
    {
      title: t("admin_dashboard.total_orders"),
      value: stats.loading ? "..." : stats.totalOrders,
      icon: "cart",
    },
    {
      title: t("admin_dashboard.total_customers"),
      value: stats.loading ? "..." : stats.totalCustomers,
      icon: "user",
    },
    {
      title: t("admin_dashboard.total_products"),
      value: stats.loading ? "..." : stats.totalProducts,
      icon: "box",
    },
    {
      title: t("admin_dashboard.pending_orders"),
      value: stats.loading ? "..." : stats.pendingOrders,
      icon: "clock",
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
