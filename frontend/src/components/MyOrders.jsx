import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  markNotificationAsRead,
  getUserNotifications,
} from "../api/notificationApi";

function MyOrders() {
  const { user, token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const markOrderAsRead = async (orderId) => {
    if (!user || !token) return;
    try {
      const notifications = await getUserNotifications(user.id, token);
      const orderNotification = notifications.find(
        (n) => n.order_id === orderId && !n.is_read
      );
      if (orderNotification) {
        await markNotificationAsRead(orderNotification.id, token);
      }
    } catch (err) {
      console.error("Error marking order notification as read:", err);
    }
  };

  const fetchOrders = async () => {
    if (!user || !token) return;
    setLoading(true);
    setError("");
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/orders/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      // No longer filter out cancelled orders from the display; display all orders
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, token]);

  const handleViewDetails = (orderId) => {
    markOrderAsRead(orderId);
  };

  const handleCancelOrder = async (orderId) => {
    if (!user || !token) {
      console.error("User not authenticated.");
      return;
    }

    if (window.confirm(t("confirm_cancel_order"))) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(
          `${API_URL}/api/orders/${orderId}/cancel`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to cancel order");
        }

        // If successful, re-fetch orders to update the UI
        fetchOrders();
        alert(t("order_cancelled_success"));
      } catch (err) {
        console.error("Error cancelling order:", err);
        alert(t("order_cancelled_error", { error: err.message }));
      }
    }
  };

  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center bg-gradient-to-br from-green-50 to-white py-12 px-2">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-8 border border-green-100">
        <h2 className="text-3xl font-extrabold text-green-700 mb-8 text-center">
          {t("my_orders_title")}
        </h2>
        {loading ? (
          <div className="text-gray-500 text-center">{t("loading_orders")}</div>
        ) : error ? (
          <div className="text-red-500 text-center">
            {t("error_message", { message: error })}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-gray-500 text-center">
            {t("no_orders_message")}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-6 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {t("order_id_label")} #{order.id}
                    </h3>
                    <p className="text-gray-600">
                      {t("created_at_label")}:{" "}
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                    <p className="text-green-600">
                      {t("status_label")}:{" "}
                      <span className="capitalize">
                        {t(`order_status_${order.status}`)}
                      </span>
                    </p>
                    {order.total && (
                      <p className="text-gray-600">
                        {t("total_amount_label")}:{" "}
                        {parseFloat(order.total).toLocaleString("lo-LA", {
                          style: "currency",
                          currency: "LAK",
                        })}
                      </p>
                    )}
                  </div>{" "}
                  <div className="flex gap-2 w-full md:w-auto">
                    {order.status !== "cancelled" ? (
                      <Link
                        to={`/order-confirmation/${order.id}`}
                        onClick={() => handleViewDetails(order.id)}
                        className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 text-center"
                      >
                        {t("view_details_button")}
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="flex-1 md:flex-none bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold cursor-not-allowed text-center"
                      >
                        {t("view_details_button")}
                      </button>
                    )}

                    {order.status !== "cancelled" ? (
                      <Link
                        to={`/invoice/${order.id}`}
                        className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 text-center"
                      >
                        {t("view_invoice_button")}
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="flex-1 md:flex-none bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold cursor-not-allowed text-center"
                      >
                        {t("view_invoice_button")}
                      </button>
                    )}

                    {order.status === "pending" && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex-1 md:flex-none bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition duration-200 text-center"
                      >
                        {t("cancel_order_button")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
