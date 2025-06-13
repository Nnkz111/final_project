import React, { useEffect, useState, useContext } from "react";
import AdminAuthContext from "../context/AdminAuthContext";
import { useTranslation } from "react-i18next";

function AdminNotificationsPage() {
  const { admin } = useContext(AdminAuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setError("No admin token found.");
        setLoading(false);
        return;
      }

      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${API_URL}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch notifications.");
        }

        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [admin]); // Refetch if admin context changes (e.g., login/logout)

  const markAsRead = async (id) => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      console.error("No admin token found for marking notification as read.");
      return;
    }

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Update the local state to mark the notification as read
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) =>
            notification.id === id
              ? { ...notification, is_read: true }
              : notification
          )
        );
      } else {
        console.error(`Failed to mark notification ${id} as read.`);
        // Optionally show an error message to the user
      }
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      // Optionally show an error message to the user
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
              className={`bg-white p-4 rounded-md shadow-md flex justify-between items-center ${
                notification.is_read ? "opacity-75" : ""
              }`}
            >
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
              {!notification.is_read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="ml-4 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {t("admin_notifications.mark_as_read_button")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminNotificationsPage;
