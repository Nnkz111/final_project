import React, { useContext } from "react";
import { Link } from "react-router-dom";
import AdminAuthContext from "../context/AdminAuthContext";

function AdminSidebar() {
  const { adminLogout } = useContext(AdminAuthContext);

  const handleAdminLogout = () => {
    adminLogout();
    // Redirect to admin login page handled by ProtectedRoute after logout
  };

  return (
    <div className="w-64 bg-white shadow-md flex flex-col">
      {" "}
      {/* Use flex-col for vertical layout */}
      {/* Logo Area */}
      <div className="flex items-center justify-center h-16 bg-gray-100 border-b">
        {" "}
        {/* Style to match image */}
        <svg
          className="h-8 w-8 text-green-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-gray-800 text-xl font-semibold ml-2">
          Pixel Commerce
        </span>
      </div>
      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-4 bg-white">
        {" "}
        {/* Styling for nav area */}
        {/* Dashboard Link */}
        <Link
          to="/admin"
          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m0 0l7 7m-2 2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            ></path>
          </svg>
          Dashboard
        </Link>
        {/* Add other navigation links similarly */}
        <Link
          to="/admin/analytics"
          className="flex items-center px-4 py-2 mt-2 text-gray-700 hover:bg-gray-200 rounded-md"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            ></path>
          </svg>
          Analytics
        </Link>
        <Link
          to="/admin/products"
          className="flex items-center px-4 py-2 mt-2 text-gray-700 hover:bg-gray-200 rounded-md"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            ></path>
          </svg>
          Products Management
        </Link>
        <Link
          to="/admin/categories"
          className="flex items-center px-4 py-2 mt-2 text-gray-700 hover:bg-gray-200 rounded-md"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 11H5m14 0a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2m14 0V9a2 2 0 00-2-2H7a2 2 0 00-2 2v2m7 7h.01"
            ></path>
          </svg>
          Category Management
        </Link>
        <Link
          to="/admin/orders"
          className="flex items-center px-4 py-2 mt-2 text-gray-700 hover:bg-gray-200 rounded-md"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            ></path>
          </svg>
          Orders
        </Link>
        <Link
          to="/admin/sales"
          className="flex items-center px-4 py-2 mt-2 text-gray-700 hover:bg-gray-200 rounded-md"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20.945 13H11V3.055A9.001 9.001 0 1120.945 13z"
            ></path>
          </svg>
          Sales
        </Link>
        <Link
          to="/admin/customer"
          className="flex items-center px-4 py-2 mt-2 text-gray-700 hover:bg-gray-200 rounded-md"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            ></path>
          </svg>
          Customer
        </Link>
      </nav>
      {/* Admin Logout Button (at the bottom) */}
      <div className="p-4 border-t">
        {" "}
        {/* Separator line */}
        <button
          onClick={handleAdminLogout}
          className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-red-500 hover:text-white rounded-md"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            ></path>
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;
