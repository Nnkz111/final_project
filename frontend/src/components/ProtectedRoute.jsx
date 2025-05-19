import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <div>Loading authentication...</div>; // Show a loading indicator while checking auth state
  }

  if (!user) {
    // User is not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && (!user.is_admin || user.is_admin === false)) {
    // User is authenticated but not an admin, redirect to homepage or show an access denied message
    alert("Access Denied: Admin privileges required.");
    return <Navigate to="/" replace />;
  }

  // User is authenticated (and admin if adminOnly is true), render the children
  return children;
};

export default ProtectedRoute;
