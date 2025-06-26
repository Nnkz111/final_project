import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminAuthContext from "../context/AdminAuthContext";
import { FaBell, FaShoppingCart, FaBoxOpen } from "react-icons/fa"; // Import icons, adding FaBoxOpen for low stock
import { useTranslation } from "react-i18next";
import {
  getAdminNotifications,
  getLowStockNotifications,
} from "../api/notificationApi"; // Import both API functions

function AdminHeader() {
  const { admin, adminLogout } = useContext(AdminAuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { t } = useTranslation();

  const handleAdminLogout = () => {
    adminLogout();
    // Optionally navigate to admin login page after logout
    navigate("/admin/login");
  };

  // Function to fetch notifications
  const fetchNotifications = async () => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      console.error("No admin token found.");
      return;
    }

    try {
      const [orderNotifications, lowStockProducts] = await Promise.all([
        getAdminNotifications(token), // Fetches order notifications
        getLowStockNotifications(token), // Fetches low stock products
      ]);

      // Map low stock products to a notification-like structure
      const lowStockNotifications = lowStockProducts.map((product) => ({
        id: `low_stock_${product.id}`, // Unique ID for low stock notification
        type: "low_stock",
        message: t("admin_notifications.low_stock_message", {
          productName: product.name,
          stockQuantity: product.stock_quantity,
        }),
        is_read: false, // Assume new low stock alerts are unread by default
        created_at: new Date().toISOString(), // Use current time or product update time if available
        product_id: product.id, // Add product_id for navigation if needed
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
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 10000);
    return () => clearInterval(intervalId);
  }, [t]); // Add t as a dependency for useTranslation

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      // For order notifications, mark as read on the backend
      if (notification.type !== "low_stock") {
        await markAsRead(notification.id);
      }
      // For low stock, we might just update the local state or navigate
      // No backend call to mark as read for low stock unless a specific API is added for it
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif.id === notification.id ? { ...notif, is_read: true } : notif
        )
      );
    }

    // Navigate based on notification type
    if (notification.type === "new_order" && notification.order_id) {
      navigate(`/admin/orders`);
    } else if (notification.type === "low_stock" && notification.product_id) {
      navigate(`/admin/products`); // Navigate to product management for low stock
    } else {
      navigate("/admin/orders"); // Default for other types
    }
    setShowDropdown(false);
  };

  const markAsRead = async (id) => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      console.error("No admin token found for marking notification as read.");
      return;
    }

    try {
      // Convert id to string to safely use startsWith
      const notificationIdStr = String(id);

      // Only attempt to mark as read in backend if it's not a low stock notification
      if (!notificationIdStr.startsWith("low_stock_")) {
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000";
        const requestUrl = `${API_BASE_URL}/api/notifications/${id}/read`; // Ensure /api is included
        const response = await fetch(requestUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          // Update the local state to mark the notification as read
          setNotifications(
            notifications.map((notification) =>
              notification.id === id
                ? { ...notification, is_read: true }
                : notification
            )
          );
          fetchNotifications(); // Re-fetch to ensure counts are updated
        } else {
          console.error(`Failed to mark notification ${id} as read.`);
        }
      }
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
    }
  };

  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <div className="text-xl font-semibold text-gray-800"></div>
      <div className="flex items-center space-x-4">
        {/* Notification Icon */}
        <div className="relative mr-12 cursor-pointer">
          <button
            className="relative text-gray-600 hover:text-gray-800"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <FaBell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          {/* Notification Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1">
                {notifications.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-gray-700">
                    {t("admin_notifications.dropdown_empty")}
                  </div>
                ) : (
                  notifications.slice(0, 4).map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-center px-4 py-2 text-sm border-b last:border-b-0 ${
                        notification.is_read
                          ? "bg-gray-100 text-gray-600"
                          : "font-semibold text-gray-800 hover:bg-gray-50 cursor-pointer"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Icon based on notification type */}
                      {notification.type === "new_order" ? (
                        <FaShoppingCart
                          className={`mr-3 ${
                            notification.is_read
                              ? "text-gray-400"
                              : "text-green-600"
                          }`}
                        />
                      ) : notification.type === "low_stock" ? (
                        <FaBoxOpen
                          className={`mr-3 ${
                            notification.is_read
                              ? "text-gray-400"
                              : "text-red-600"
                          }`}
                        />
                      ) : null}
                      <span>{notification.message}</span>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 4 && (
                <Link
                  to="/admin/notifications"
                  className="block text-center px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 border-t"
                  onClick={() => setShowDropdown(false)}
                >
                  {t("admin_notifications.dropdown_view_all")}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
