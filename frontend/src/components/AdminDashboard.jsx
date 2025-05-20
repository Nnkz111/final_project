import React, { useContext } from "react";
import AdminAuthContext from "../context/AdminAuthContext";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const { adminLogout } = useContext(AdminAuthContext);
  const navigate = useNavigate();

  const handleAdminLogout = () => {
    adminLogout();
    navigate("/admin/login");
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      {/* Add admin dashboard content here */}
      <button
        onClick={handleAdminLogout}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-800"
      >
        Admin Logout
      </button>
    </div>
  );
}

export default AdminDashboard;
