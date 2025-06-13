import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true); // Loading state for admin auth

  // Check for admin token in localStorage on component mount
  useEffect(() => {
    const storedAdminToken = localStorage.getItem("adminToken");
    const storedAdminUser = localStorage.getItem("adminUser");
    if (storedAdminToken && storedAdminUser) {
      setAdminToken(storedAdminToken);
      setAdminUser(JSON.parse(storedAdminUser));
    }
    setIsLoadingAdmin(false);
  }, []);

  const adminLogin = async (emailOrUsername, password) => {
    try {
      const payload = emailOrUsername.includes("@")
        ? { email: emailOrUsername, password }
        : { username: emailOrUsername, password };
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await axios.post(
        `${API_URL}/api/auth/login`, // Still using the same login endpoint
        payload
      );
      const { token: receivedToken, user: userInfo } = response.data;

      // Crucially, check if the logged-in user is an admin
      if (!userInfo.is_admin) {
        // If not an admin, return failure and do not store credentials
        return {
          success: false,
          error: "Access Denied: Not an administrator.",
        };
      }

      // If it is an admin, store admin-specific credentials
      setAdminToken(receivedToken);
      setAdminUser(userInfo);
      localStorage.setItem("adminToken", receivedToken);
      localStorage.setItem("adminUser", JSON.stringify(userInfo));

      return { success: true };
    } catch (error) {
      console.error(
        "Admin Login error:",
        error.response?.data?.error || error.message
      );
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "An error occurred during admin login.",
      };
    }
  };

  const adminLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
  };

  return (
    <AdminAuthContext.Provider
      value={{ adminUser, adminToken, isLoadingAdmin, adminLogin, adminLogout }}
    >
      {!isLoadingAdmin && children}
      {isLoadingAdmin && <div></div>}{" "}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;
