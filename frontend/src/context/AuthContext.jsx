import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // To check for token in localStorage on initial load

  // Check for customer token in localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("customerToken"); // Use customerToken
    const storedUser = localStorage.getItem("customerUser"); // Use customerUser
    if (storedToken && storedUser) {
      // Ensure the stored user is NOT an admin
      const parsedUser = JSON.parse(storedUser);
      if (!parsedUser.is_admin) {
        setToken(storedToken);
        // Ensure customer data is nested when loaded from localStorage
        const userToSet = {
          ...parsedUser,
          customer: {
            name: parsedUser.customer_name || parsedUser.customer?.name || null,
            phone: parsedUser.phone || parsedUser.customer?.phone || null,
            address: parsedUser.address || parsedUser.customer?.address || null,
          },
        };
        // Clean up old flattened properties if they exist
        delete userToSet.customer_name;
        delete userToSet.customer_phone;
        delete userToSet.customer_address;
        setUser(userToSet);
      } else {
        // If an admin token/user was somehow stored here, clear it
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (emailOrUsername, password) => {
    try {
      const payload = emailOrUsername.includes("@")
        ? { email: emailOrUsername, password }
        : { username: emailOrUsername, password };
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await axios.post(`${API_URL}/api/auth/login`, payload);
      const { token: receivedToken, user: userInfo } = response.data;

      // Ensure the logged-in user is NOT an admin for this context
      if (userInfo.is_admin) {
        return {
          success: false,
          error: "Access Denied: Admin accounts cannot login here.",
        };
      }

      setToken(receivedToken);
      // Ensure customer data is nested after login
      setUser({
        id: userInfo.id,
        email: userInfo.email,
        username: userInfo.username,
        is_admin: userInfo.is_admin,
        customer: {
          name: userInfo.customer_name || userInfo.customer?.name || null,
          phone: userInfo.phone || userInfo.customer?.phone || null,
          address: userInfo.address || userInfo.customer?.address || null,
        },
      });
      localStorage.setItem("customerToken", receivedToken); // Use customerToken
      localStorage.setItem(
        "customerUser",
        JSON.stringify({
          id: userInfo.id,
          email: userInfo.email,
          username: userInfo.username,
          is_admin: userInfo.is_admin,
          customer: {
            name: userInfo.customer_name || userInfo.customer?.name || null,
            phone: userInfo.phone || userInfo.customer?.phone || null,
            address: userInfo.address || userInfo.customer?.address || null,
          },
        })
      ); // Use customerUser
      return { success: true, isAdmin: userInfo.is_admin };
    } catch (error) {
      console.error(
        "Customer Login error:",
        error.response?.data?.error || error.message
      );
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "An error occurred during customer login.",
      };
    }
  };

  const register = async (email, password, username, name) => {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        username,
        name,
      });
      // Optionally, log in the user automatically after successful registration
      // login(email, password);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Registration error:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "An unexpected error occurred during registration.",
        errors: error.response?.data?.errors || [], // Return the errors array
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("customerToken"); // Use customerToken
    localStorage.removeItem("customerUser"); // Use customerUser
  };

  // Function to update user state and localStorage
  const updateUser = (updatedUserInfo) => {
    setUser(updatedUserInfo);
    localStorage.setItem("customerUser", JSON.stringify(updatedUserInfo));
  };

  // Provide loading state as well
  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, updateUser }}
    >
      {!isLoading && children}
      {isLoading && <div></div>} {/* Optional loading indicator */}
    </AuthContext.Provider>
  );
};

export default AuthContext;
