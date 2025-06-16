import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Function to get notifications for a specific user
export const getUserNotifications = async (userId, token) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/notifications/user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    throw error;
  }
};

// Function to mark a notification as read
export const markNotificationAsRead = async (notificationId, token) => {
  try {
    const response = await axios.put(
      `${API_URL}/api/notifications/user/${notificationId}/read`,
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error marking notification ${notificationId} as read:`,
      error
    );
    throw error;
  }
};
