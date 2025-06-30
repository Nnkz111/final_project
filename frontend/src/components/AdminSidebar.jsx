import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import AdminAuthContext from "../context/AdminAuthContext";
import { useTranslation } from "react-i18next";

function AdminSidebar() {
  const { adminLogout, adminUser } = useContext(AdminAuthContext);
  const { t } = useTranslation();
  const [isReportsDropdownOpen, setIsReportsDropdownOpen] = useState(false);

  const handleAdminLogout = () => {
    adminLogout();
    // Redirect to admin login page handled by ProtectedRoute after logout
  };

  return (
    <div className="w-64 bg-white shadow-md flex flex-col">
      {" "}
      {/* Use flex-col for vertical layout */}
      {/* Logo Area */}
      <div className="p-4 border-b">
        <Link to="/admin" className="text-xl font-bold text-gray-800">
          Admin Panel
        </Link>
      </div>
      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-4 bg-white">
        {/* Only show allowed links for staff, all for admin */}
        {adminUser && adminUser.role === "staff" && (
          <>
            {/* Home (Dashboard) */}
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
              {t("adminSidebar.dashboardLink")}
            </Link>
            {/* Product Management */}
            <Link
              to="/admin/products"
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
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                ></path>
              </svg>
              {t("adminSidebar.productsManagementLink")}
            </Link>
            {/* Category Management */}
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
              {t("adminSidebar.categoryManagementLink")}
            </Link>
            {/* Order Management */}
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
              {t("adminSidebar.ordersLink")}
            </Link>
            {/* Notifications */}
            <Link
              to="/admin/notifications"
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
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.47 6.659 6 8.366 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                ></path>
              </svg>
              {t("adminSidebar.notificationsLink")}
            </Link>
            {/* Reports Dropdown (only product and order/sales) */}
            <div className="relative">
              <button
                onClick={() => setIsReportsDropdownOpen(!isReportsDropdownOpen)}
                className="flex items-center w-full px-4 py-2 mt-2 text-gray-700 hover:bg-gray-200 rounded-md focus:outline-none"
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
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                ລາຍງານ
                <svg
                  className={`h-4 w-4 ml-auto transform ${
                    isReportsDropdownOpen ? "rotate-180" : "rotate-0"
                  } transition-transform duration-200`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isReportsDropdownOpen && (
                <div className="pl-8 pt-2 pb-2">
                  <Link
                    to="/admin/reports/products"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
                    onClick={() => setIsReportsDropdownOpen(false)}
                  >
                    ລາຍງານຂໍ້ມູນສິນຄ້າ
                  </Link>
                  <Link
                    to="/admin/reports/sales"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
                    onClick={() => setIsReportsDropdownOpen(false)}
                  >
                    ລາຍງານຂໍ້ມູນການສັ່ງຊື້ສິນຄ້າ
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
        {/* Only show the rest for admin */}
        {adminUser && adminUser.role === "admin" && (
          <>
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
              {t("adminSidebar.dashboardLink")}
            </Link>
            <Link
              to="/admin/users"
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
              {t("adminSidebar.userManagementLink")}
            </Link>
            <Link
              to="/admin/employees"
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
                  d="M16 11c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm-8 0c1.104 0 2-.896 2-2s-.896-2-2-2-2 .896-2 2 .896 2 2 2zm0 2c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4zm8 0c-.29 0-.57.03-.84.08C15.39 13.17 16 14.02 16 15v1h6v-1c0-2.21-1.79-4-4-4z"
                />
              </svg>
              ຈັດການຂໍ້ມູນພະນັກງານ
            </Link>
            <Link
              to="/admin/customers"
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
              {t("adminSidebar.customerManagementLink")}
            </Link>
            <Link
              to="/admin/notifications"
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
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.47 6.659 6 8.366 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                ></path>
              </svg>
              {t("adminSidebar.notificationsLink")}
            </Link>
            {/* Reports Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsReportsDropdownOpen(!isReportsDropdownOpen)}
                className="flex items-center w-full px-4 py-2 mt-2 text-gray-700 hover:bg-gray-200 rounded-md focus:outline-none"
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
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                ລາຍງານ
                <svg
                  className={`h-4 w-4 ml-auto transform ${
                    isReportsDropdownOpen ? "rotate-180" : "rotate-0"
                  } transition-transform duration-200`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isReportsDropdownOpen && (
                <div className="pl-8 pt-2 pb-2">
                  <Link
                    to="/admin/reports/products"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
                    onClick={() => setIsReportsDropdownOpen(false)}
                  >
                    ລາຍງານຂໍ້ມູນສິນຄ້າ
                  </Link>
                  <Link
                    to="/admin/reports/customers"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
                    onClick={() => setIsReportsDropdownOpen(false)}
                  >
                    ລາຍງານຂໍ້ມູນລູກຄ້າ
                  </Link>
                  <Link
                    to="/admin/sales"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
                    onClick={() => setIsReportsDropdownOpen(false)}
                  >
                    {t("adminSidebar.incomeReportLink")}
                  </Link>
                  <Link
                    to="/admin/reports/sales"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
                    onClick={() => setIsReportsDropdownOpen(false)}
                  >
                    ລາຍງານຂໍ້ມູນການສັ່ງຊື້ສິນຄ້າ
                  </Link>
                  <Link
                    to="/admin/reports/employees"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md"
                    onClick={() => setIsReportsDropdownOpen(false)}
                  >
                    ລາຍງານພະນັກງານ
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
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
          {t("logout_button_text")}
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;
