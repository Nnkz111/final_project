import React, { useEffect, useState, useContext } from "react";
import AdminAuthContext from "../context/AdminAuthContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  getAdminNotifications,
  getLowStockNotifications,
} from "../api/notificationApi";
import { FaShoppingCart, FaBoxOpen } from "react-icons/fa";

function AdminNotificationsPage() {
  const { admin } = useContext(AdminAuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Function to fetch notifications
  const fetchNotifications = async () => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      setError("No admin token found.");
      setLoading(false);
      return;
    }

    try {
      const [orderNotifications, lowStockProducts] = await Promise.all([
        getAdminNotifications(token),
        getLowStockNotifications(token),
      ]);

      const lowStockNotifications = lowStockProducts.map((product) => ({
        id: `low_stock_${product.id}`,
        type: "low_stock",
        message: t("admin_notifications.low_stock_message", {
          productName: product.name,
          stockQuantity: product.stock_quantity,
        }),
        is_read: false,
        created_at: new Date().toISOString(),
        product_id: product.id,
      }));

      // Filter out already read order notifications
      const unreadOrderNotifications = orderNotifications.filter(
        (notif) => !notif.is_read
      );

      // Sort unread order notifications by creation date (newest first)
      unreadOrderNotifications.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      // Sort low stock notifications by creation date (newest first)
      lowStockNotifications.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      // Combine notifications, prioritizing order notifications
      const combinedNotifications = [
        ...unreadOrderNotifications,
        ...lowStockNotifications,
      ];

      setNotifications(combinedNotifications);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const pollingInterval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(pollingInterval);
  }, [admin, t]);

  const markAsRead = async (id) => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      console.error("No admin token found for marking notification as read.");
      return;
    }

    try {
      const notificationIdStr = String(id);

      if (!notificationIdStr.startsWith("low_stock_")) {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(
          `${API_URL}/api/notifications/${id}/read`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          console.error(`Failed to mark notification ${id} as read.`);
          // Even if backend fails, attempt to update locally for responsiveness
        }
      }
      // Update local state for all notification types (including low_stock) immediately
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
      // Re-fetch all notifications to ensure the list is up-to-date and read ones are filtered out
      fetchNotifications();
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.type === "new_order" && notification.order_id) {
      navigate(`/admin/orders`);
    } else if (notification.type === "low_stock" && notification.product_id) {
      navigate(`/admin/products`);
    } else if (
      notification.type === "order_cancelled" &&
      notification.order_id
    ) {
      navigate(`/admin/orders?status=cancelled`);
    } else {
      navigate("/admin/dashboard");
    }
  };

  if (loading) {
    return <div className="p-6">{t("admin_notifications.loading")}</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        {t("admin_notifications.error", { error })}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-semibold mb-6">
        {t("admin_notifications.title")}
      </h1>
      {notifications.length === 0 ? (
        <div className="bg-white p-4 rounded-md shadow-md text-gray-600">
          {t("admin_notifications.empty")}
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white p-4 rounded-md shadow-md flex justify-between items-center cursor-pointer ${
                notification.is_read ? "opacity-75" : ""
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-center">
                {notification.type === "new_order" ? (
                  <FaShoppingCart
                    className={`mr-3 text-2xl ${
                      notification.is_read ? "text-gray-400" : "text-green-600"
                    }`}
                  />
                ) : notification.type === "low_stock" ? (
                  <FaBoxOpen
                    className={`mr-3 text-2xl ${
                      notification.is_read ? "text-gray-400" : "text-red-600"
                    }`}
                  />
                ) : null}
                <div>
                  <p
                    className={`${
                      notification.is_read ? "text-gray-600" : "font-semibold"
                    }`}
                  >
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminNotificationsPage;
