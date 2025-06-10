import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import AdminAuthContext from "../context/AdminAuthContext";

const ProtectedRoute = ({
  children,
  adminOnly = false,
  customerOnly = false,
}) => {
  const { user, isLoading } = useContext(AuthContext);
  const { adminUser, isLoadingAdmin } = useContext(AdminAuthContext);

  if (isLoading || isLoadingAdmin) {
    return <div></div>;
  }

  if (adminOnly) {
    if (!adminUser) {
      return <Navigate to="/admin/login" replace />;
    }
    return children;
  }

  if (customerOnly) {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }

  return children;
};

export default ProtectedRoute;
