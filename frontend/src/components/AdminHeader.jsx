import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminAuthContext from "../context/AdminAuthContext";

function AdminHeader() {
  const { admin, adminLogout } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  const handleAdminLogout = () => {
    adminLogout();
    // Optionally navigate to admin login page after logout
    navigate("/admin/login");
  };

  return <header></header>;
}

export default AdminHeader;
