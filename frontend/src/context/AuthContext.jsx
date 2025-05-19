import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // To check for token in localStorage on initial load

  // Check for token in localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Optionally, verify the token with the backend here if needed
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          email,
          password,
        }
      );
      const { token: receivedToken, user: userInfo } = response.data;
      setToken(receivedToken);
      setUser(userInfo);
      localStorage.setItem("token", receivedToken);
      localStorage.setItem("user", JSON.stringify(userInfo));
      return { success: true };
    } catch (error) {
      console.error("Login error:", error.response.data);
      return { success: false, error: error.response.data.error };
    }
  };

  const register = async (email, password, username) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          email,
          password,
          username,
        }
      );
      // Optionally, log in the user automatically after successful registration
      // login(email, password);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Registration error:", error.response.data);
      return { success: false, error: error.response.data.error };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Provide loading state as well
  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout }}
    >
      {!isLoading && children}
      {isLoading && <div>Loading user...</div>}{" "}
      {/* Optional loading indicator */}
    </AuthContext.Provider>
  );
};

export default AuthContext;
