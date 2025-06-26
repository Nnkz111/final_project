import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Function to get notifications for a specific user
export const getUserNotifications = async (userId, token) => {
  try {
    const response = await fetch(
      `${API_URL}/api/notifications/user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch user notifications");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    throw error;
  }
};

// Function to mark a notification as read
export const markNotificationAsRead = async (notificationId, token) => {
  try {
    const response = await fetch(
      `${API_URL}/api/notifications/user/${notificationId}/read`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to mark notification as read");
    }
    return await response.json();
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

export const getAdminNotifications = async (token) => {
  try {
    const response = await fetch(`${API_URL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch admin notifications");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    throw error;
  }
};

// New API function to fetch low stock notifications
export const getLowStockNotifications = async (token) => {
  try {
    const response = await fetch(`${API_URL}/api/notifications/low-stock`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch low stock notifications");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching low stock notifications:", error);
    throw error;
  }
};
