import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminAuthContext from "../context/AdminAuthContext";
import { FaBell, FaShoppingCart } from "react-icons/fa"; // Import icons
import { useTranslation } from "react-i18next";

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

  // Fetch notifications on component mount
  useEffect(() => {
    const fetchNotifications = async () => {
      // In a real application, you'd get the token from your auth context
      const token = localStorage.getItem("adminToken"); // Assuming token is stored in localStorage

      if (!token) {
        console.error("No admin token found.");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:5000/api/notifications",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch notifications.");
        }
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    // Implement polling or WebSockets here for real-time updates
    const intervalId = setInterval(fetchNotifications, 10000); // Poll every 60 seconds
    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []); // Empty dependency array means this runs once on mount

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    // Navigate to the order management page, potentially with the order ID
    // Assuming your order management route is /admin/orders and can handle an ID
    if (notification.type === "new_order" && notification.order_id) {
      navigate(`/admin/orders`);
    } else {
      // Handle other notification types or just navigate to the general orders page
      navigate("/admin/orders");
    }
    setShowDropdown(false); // Close the dropdown after clicking
  };

  const markAsRead = async (id) => {
    const token = localStorage.getItem("adminToken"); // Get the admin token

    if (!token) {
      console.error("No admin token found for marking notification as read.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/notifications/${id}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Update the local state to mark the notification as read
        setNotifications(
          notifications.map((notification) =>
            notification.id === id
              ? { ...notification, is_read: true }
              : notification
          )
        );
        // Optional: Refetch notifications after marking as read to ensure the unread count is updated correctly,
        // especially if using polling less frequently.
        fetchNotifications();
      } else {
        console.error(`Failed to mark notification ${id} as read.`);
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
            <FaBell className="h-6 w-6" /> {/* Bell icon for the button */}
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
                      onClick={() => handleNotificationClick(notification)} // Use the new handler
                    >
                      {/* Shopping cart icon for notification message */}
                      <FaShoppingCart
                        className={`mr-3 ${
                          notification.is_read
                            ? "text-gray-400"
                            : "text-green-600"
                        }`}
                      />
                      <span>{notification.message}</span>
                      {/* Optionally add timestamp: */}
                      {/* <p className="text-xs text-gray-500 mt-1">{new Date(notification.created_at).toLocaleString()}</p> */}
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
