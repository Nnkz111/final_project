import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import AuthContext from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import { getUserNotifications } from "../api/notificationApi";

const MobileNavbar = () => {
  const { cartItemCount } = useCart();
  const { user, logout } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notificationCount, setNotificationCount] = useState(0);
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setShowLogout(false);
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const notifications = await getUserNotifications(
          user.id,
          localStorage.getItem("customerToken")
        );
        const unreadCount = notifications.filter((n) => !n.is_read).length;
        setNotificationCount(unreadCount);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-up flex justify-around items-center h-16 z-50 md:hidden">
      <Link
        to="/"
        className="flex flex-col items-center text-gray-600 hover:text-blue-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        <span className="text-[10px] mt-1">{t("Home")}</span>
      </Link>
      <Link
        to="/categories"
        className="flex flex-col items-center text-gray-600 hover:text-blue-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        <span className="text-[10px] mt-1">{t("Category")}</span>
      </Link>
      <Link
        to="/cart"
        className="flex flex-col items-center text-gray-600 hover:text-blue-600 relative"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {cartItemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
            {cartItemCount}
          </span>
        )}
        <span className="text-[10px] mt-1">{t("cart_link_text")}</span>
      </Link>
      {user && (
        <Link
          to="/my-orders"
          className="flex flex-col items-center text-gray-600 hover:text-blue-600 relative"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
          <span className="text-[10px] mt-1">{t("my_orders")}</span>
        </Link>
      )}{" "}
      <div className="relative">
        {user ? (
          <button
            onClick={() => setShowLogout(!showLogout)}
            className="flex flex-col items-center text-gray-600 hover:text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-[10px] mt-1">{t("profile")}</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="flex flex-col items-center text-gray-600 hover:text-blue-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-[10px] mt-1">{t("login_link_text")}</span>
          </Link>
        )}

        {showLogout && user && (
          <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-2 w-32 border border-gray-200">
            <Link
              to="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              onClick={() => setShowLogout(false)}
            >
              {t("profile")}
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 rounded"
            >
              {t("logout_button_text")}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default MobileNavbar;
