import React, { useEffect, useState, useContext } from "react";
import SalesAnalytic from "./SalesAnalytic";
import TopSellingProducts from "./TopSellingProducts";
import AdminAuthContext from "../context/AdminAuthContext";

function AdminSalesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { adminToken } = useContext(AdminAuthContext);

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
        setOrders(data.slice(0, 20)); // Show last 20 orders
      } catch (err) {
        setError(err.message);
      } finally {
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-green-700">
        Sales Dashboard
      </h1>
      <SalesAnalytic />
      <TopSellingProducts />
      <div className="bg-white p-6 rounded-2xl shadow-xl mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Recent Sales (Last 20 Orders)
          </h2>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center text-sm"
            onClick={handleExportCSV}
            disabled={!orders.length}
          >
            Export CSV
          </button>
        </div>
        {loading ? (
          <div className="text-gray-500">Loading orders...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-gray-500">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Payment
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
                      {order.status}
                    </td>
                    <td className="px-4 py-3">
                      {order.created_at &&
                        new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{order.item_count}</td>
                    <td className="px-4 py-3 font-bold text-green-700">
                      ${parseFloat(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {order.payment_type || "-"}
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
