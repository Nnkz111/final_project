import React, { useEffect, useState, useContext } from "react";
import SalesAnalytic from "./SalesAnalytic";
import TopSellingProducts from "./TopSellingProducts";
import AdminAuthContext from "../context/AdminAuthContext";
import { useTranslation } from "react-i18next";

function AdminSalesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingStatus, setEditingStatus] = useState({});
  const { adminToken } = useContext(AdminAuthContext);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:5000/api/orders", {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        if (data && Array.isArray(data.orders)) {
          setOrders(data.orders.slice(0, 10));
        } else if (Array.isArray(data)) {
          setOrders(data.slice(0, 10));
        } else {
          throw new Error("Unexpected data format from orders API");
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchOrders();
  }, [adminToken]);

  // Export orders to CSV
  const handleExportCSV = () => {
    if (!orders.length) return;
    const header = [
      "Order ID",
      "User",
      "Status",
      "Created",
      "Items",
      "Total",
      "Payment",
    ];
    const rows = orders.map((order) => [
      order.id,
      order.username || order.user_id,
      order.status,
      order.created_at ? new Date(order.created_at).toLocaleString() : "",
      order.item_count,
      order.total,
      order.payment_type || "-",
    ]);
    const csvContent = [header, ...rows]
      .map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",")
              ? `"${cell.replace(/"/g, '""')}"`
              : cell
          )
          .join(",")
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sales_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch full order details for modal
  const openOrderModal = async (order) => {
    // ... existing code ...
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-green-700">
        {t("salesDashboard.title")}
      </h1>
      <SalesAnalytic />
      <TopSellingProducts />
      <div className="bg-white p-6 rounded-2xl shadow-xl mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {t("salesDashboard.recentSales")}
          </h2>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center text-sm"
            onClick={handleExportCSV}
            disabled={!orders.length}
          >
            Export CSV
          </button>
        </div>
        {/* Removed Filter Bar */}
        {/* <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div>
            <label className="font-semibold mr-2">Filter by Status:</label>
            <select
              className="border rounded px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div> */}
        {loading ? (
          <div className="text-gray-500">
            {t("salesDashboard.loadingOrders")}
          </div>
        ) : error ? (
          <div className="text-red-500">
            {t("salesDashboard.error", { error: error })}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-gray-500">
            {t("salesDashboard.noOrdersFound")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    {t("salesDashboard.orderId")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    {t("salesDashboard.user")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    {t("salesDashboard.status")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    {t("salesDashboard.created")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    {t("salesDashboard.items")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    {t("salesDashboard.total")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    {t("salesDashboard.payment")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-green-50 transition">
                    <td className="px-4 py-3 font-mono">#{order.id}</td>
                    <td className="px-4 py-3">
                      {order.username || order.user_id}
                    </td>
                    <td className="px-4 py-3 capitalize font-semibold text-green-700">
                      {t(`order_status_${order.status}`)}
                    </td>
                    <td className="px-4 py-3">
                      {order.created_at &&
                        new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{order.item_count}</td>
                    <td className="px-4 py-3 font-bold text-green-700">
                      {parseFloat(order.total).toLocaleString("lo-LA", {
                        style: "currency",
                        currency: "LAK",
                      })}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {order.payment_type
                        ? t(`payment_type_${order.payment_type}`)
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSalesPage;
