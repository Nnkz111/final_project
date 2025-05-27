import React from "react";
import AdminSidebar from "./AdminSidebar"; // We will create this component next
import AdminHeader from "./AdminHeader";

function AdminLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {" "}
      {/* Main container for the layout */}
      <AdminSidebar /> {/* Admin Sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {" "}
        {/* Main content area */}
        <AdminHeader /> {/* Admin Header */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
          {" "}
          {/* Main content with padding */}
          {children}{" "}
          {/* This is where the routed components (like AdminDashboard) will render */}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
