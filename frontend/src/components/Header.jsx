import React, { useEffect, useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import AuthContext from "../context/AuthContext";
import { useCategories } from "../context/CategoryContext";
import { useLocation, useNavigate } from "react-router-dom";
import CategoryMegaDropdown from "./CategoryMegaDropdown";
import "flag-icons/css/flag-icons.min.css";
import { useTranslation } from "react-i18next";
import {
  getUserNotifications,
  markNotificationAsRead,
} from "../api/notificationApi"; // Import API functions

function Header({ showMegaDropdown }) {
  const { cartItemCount } = useCart(); // Get count from context
  const { user, logout, token } = useContext(AuthContext); // Get user, logout, AND token from AuthContext
  const [profileOpen, setProfileOpen] = useState(false);
  const { hierarchicalCategories, loading } = useCategories();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { t, i18n } = useTranslation(); // Get the t and i18n instance
  const [langDropdownOpen, setLangDropdownOpen] = useState(false); // State for language dropdown
  const [notificationOpen, setNotificationOpen] = useState(false); // State for notification dropdown
  const [notifications, setNotifications] = useState([]); // State to store notifications
  const [unreadCount, setUnreadCount] = useState(0); // State to store unread notification count

  const handleLogout = () => {
    logout(); // Call the customer logout function from AuthContext
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Fetch notifications when user is logged in
  useEffect(() => {
    const fetchNotifications = async () => {
      // Ensure user, user.token, and user.id are available and user is not admin
      if (user && token && user.id && !user.is_admin) {
        try {
          const userNotifications = await getUserNotifications(user.id, token);
          setNotifications(userNotifications);
          // Calculate unread count
          const count = userNotifications.filter(
            (notif) => !notif.is_read
          ).length;
          setUnreadCount(count);
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        }
      } else if (!user) {
        // Clear notifications if user logs out
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    fetchNotifications();
    const pollingInterval = setInterval(fetchNotifications, 10000);

    return () => clearInterval(pollingInterval); // Cleanup interval on unmount
  }, [user, token]); // Refetch when user changes

  // Handle marking a notification as read
  const handleMarkAsRead = async (notificationId) => {
    if (user && token) {
      try {
        await markNotificationAsRead(notificationId, token);
        // Update the notification in the state
        setNotifications(
          notifications.map((notif) =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );
        // Decrement unread count if it was unread (only if it was previously unread)
        const notificationToMark = notifications.find(
          (notif) => notif.id === notificationId
        );
        if (notificationToMark && !notificationToMark.is_read) {
          setUnreadCount((prevCount) => (prevCount > 0 ? prevCount - 1 : 0));
        }
      } catch (error) {
        console.error(
          `Failed to mark notification ${notificationId} as read:`,
          error
        );
      }
    }
  };

  // Dropdown menu for categories
  const renderCategoryDropdown = () => (
    <nav
      className="w-full bg-white border-b border-gray-200 shadow-sm z-40 sticky top-[64px]"
      style={{ outline: "2px solid red" }}
    >
      <div className="container mx-auto flex flex-row items-stretch relative">
        <ul className="flex flex-row gap-2 py-2 w-full overflow-x-auto">
          {hierarchicalCategories.map((cat) => (
            <li
              key={cat.id}
              className="relative group"
              onMouseEnter={() => setActiveDropdown(cat.id)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to={`/category/${cat.id}`}
                className={`px-4 py-2 rounded font-medium text-gray-700 hover:bg-green-100 hover:text-green-700 transition whitespace-nowrap ${
                  location.pathname === `/category/${cat.id}`
                    ? "bg-green-100 text-green-700"
                    : ""
                }`}
              >
                {cat.name}
              </Link>
              {cat.children &&
                cat.children.length > 0 &&
                activeDropdown === cat.id && (
                  <div className="absolute left-0 top-full mt-1 bg-white shadow-lg rounded border z-50 min-w-[200px] animate-fade-in">
                    <ul className="py-2">
                      {cat.children.map((sub) => (
                        <li key={sub.id} className="relative group">
                          <Link
                            to={`/category/${sub.id}`}
                            className="block px-4 py-2 text-gray-700 hover:bg-green-100 hover:text-green-700 whitespace-nowrap"
                          >
                            {sub.name}
                          </Link>
                          {/* Nested subcategories */}
                          {sub.children && sub.children.length > 0 && (
                            <div className="absolute left-full top-0 ml-1 bg-white shadow-lg rounded border z-50 min-w-[200px] animate-fade-in">
                              <ul className="py-2">
                                {sub.children.map((subsub) => (
                                  <li key={subsub.id}>
                                    <Link
                                      to={`/category/${subsub.id}`}
                                      className="block px-4 py-2 text-gray-700 hover:bg-green-100 hover:text-green-700 whitespace-nowrap"
                                    >
                                      {subsub.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </li>
          ))}
        </ul>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease;
        }
      `}</style>
    </nav>
  );

  return (
    <>
      <header className="bg-gray-800 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center mr-6 hover:opacity-80 transition-opacity"
          >
            <img
              src="https://res.cloudinary.com/dgfk0ljyq/image/upload/v1749228072/web_icon_t8i1f2.png"
              alt="MR.IT Logo"
              className="h-14 w-14 rounded-full mr-2"
            />
            <span className="text-3xl font-bold">MR.IT</span>
          </Link>

          {/* Search Bar Area - more refined styling */}
          <div className="flex-grow mx-4 flex items-center bg-white rounded-md overflow-hidden">
            <input
              type="text"
              placeholder={t("search_placeholder")}
              className="w-full p-2 text-gray-800 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearch(e);
              }}
            />
            {/* Search Icon Placeholder */}
            <button
              className="px-4 py-2 bg-gray-200 text-gray-600 hover:bg-gray-300"
              onClick={handleSearch}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* User/Cart Icons Area - using flex and spacing */}
          <div className="flex items-center space-x-6 ml-6">
            {/* Language Switcher Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setLangDropdownOpen(true)}
              onMouseLeave={() => setLangDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 focus:outline-none text-sm">
                {i18n.language === "en" ? (
                  <span className="fi fi-us"></span>
                ) : (
                  <span className="fi fi-la"> </span>
                )}
                <span>
                  {i18n.language === "en"
                    ? "ENG"
                    : i18n.language === "lo"
                    ? "ລາວ"
                    : i18n.language.toUpperCase()}
                </span>
                <svg
                  className={`h-4 w-4 transition-transform duration-200 ${
                    langDropdownOpen ? "rotate-180" : "rotate-0"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 w-30 bg-white text-gray-800 rounded-md shadow-lg z-[60]">
                  <button
                    onClick={() => {
                      i18n.changeLanguage("en");
                      setLangDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-sm hover:text-blue-600 rounded-lg flex items-center gap-2"
                  >
                    <span className="fi fi-us"></span>
                    English
                  </button>
                  <button
                    onClick={() => {
                      i18n.changeLanguage("lo");
                      setLangDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-sm hover:text-blue-600 rounded-lg  flex items-center gap-2"
                  >
                    {" "}
                    <span className="fi fi-la"></span>
                    ລາວ
                  </button>
                </div>
              )}
            </div>

            {/* Notification Icon and Dropdown */}
            {user && !user.is_admin && (
              <div
                className="relative group flex items-center"
                onMouseEnter={() => setNotificationOpen(true)}
                onMouseLeave={() => setNotificationOpen(false)}
              >
                <button className="flex items-center gap-2 focus:outline-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.465 6.015 6 8.309 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0v2a3 3 0 01-3 3H9a3 3 0 01-3-3v-2m6 0H9"
                    />
                  </svg>

                  {/* Notification count badge */}
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <span className="cursor-pointer">{t("notifications")}</span>
                {/* Notification Dropdown Menu */}
                <div
                  className={`absolute right-0 top-full w-64 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-200 z-[51] transition-all duration-200 origin-top-right ${
                    notificationOpen
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <div className="px-4 py-3 font-bold border-b border-gray-200">
                    {t("notifications")}
                  </div>
                  <div className="py-2 max-h-60 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 4).map((notif) => {
                        // Translate the order status first
                        const translatedStatus = t(
                          `order_status_${notif.order_status}`
                        );

                        return (
                          <Link
                            to={`/order-confirmation/${notif.order_id}`}
                            key={notif.id}
                            className={`block w-full px-4 py-2 hover:bg-blue-50 hover:text-blue-600 cursor-pointer text-sm flex items-center ${
                              notif.is_read ? "text-gray-500" : "font-semibold"
                            }`}
                            onClick={() => handleMarkAsRead(notif.id)}
                          >
                            {/* Add an icon here */}
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2 text-green-500 flex-shrink-0"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {/* Use the translatedStatus in the main notification message */}
                            {t(notif.message, {
                              orderId: notif.order_id,
                              status: translatedStatus,
                            })}
                          </Link>
                        );
                      })
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        {t("No_notifications")}
                      </div>
                    )}
                  </div>
                  {notifications.length > 4 && (
                    <Link
                      to="/my-orders"
                      className="block px-4 py-3 text-center text-blue-600 hover:bg-blue-50 border-t border-gray-200"
                    >
                      {t("view_all_notifications")}
                    </Link>
                  )}
                </div>
              </div>
            )}

            {user ? (
              // If customer user is logged in, show Account dropdown
              <div
                className="relative group flex items-center"
                onMouseEnter={() => setProfileOpen(true)}
                onMouseLeave={() => setProfileOpen(false)}
              >
                <button className="flex items-center gap-2 focus:outline-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.939 13.939 0 0112 16c2.5 0 4.847.655 6.879 1.804M16 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span>{user.customer.name}</span>
                  <svg
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {/* Dropdown menu - Increased z-index to appear above category dropdowns */}
                <div
                  className={`absolute right-0 top-full w-48 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-200 z-[51] transition-all duration-200 origin-top-right ${
                    profileOpen
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  <Link
                    to="/profile"
                    className="block px-4 py-3 hover:bg-blue-50 hover:text-blue-600 rounded-t-lg transition"
                    onClick={() => setProfileOpen(false)}
                  >
                    {t("profile_link_text")}
                  </Link>
                  <Link
                    to="/my-orders"
                    className="block px-4 py-3 hover:bg-blue-50 hover:text-blue-600 transition"
                    onClick={() => setProfileOpen(false)}
                  >
                    {t("my_orders_link_text")}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setProfileOpen(false);
                    }}
                    className="block w-full text-left px-4 py-3 hover:bg-blue-50  rounded-b-lg transition text-red-600"
                  >
                    {t("logout_button_text")}
                  </button>
                </div>
              </div>
            ) : (
              // If no customer user is logged in, show Login and Register links
              <>
                <Link
                  to="/login"
                  className="flex items-center flex-col text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.939 13.939 0 0112 16c2.5 0 4.847.655 6.879 1.804M16 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span>{t("login_link_text")}</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center flex-col text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A13.939 13.939 0 0112 16c2.5 0 4.847.655 6.879 1.804M16 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span>{t("register_link_text")}</span>
                </Link>
              </>
            )}

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="flex items-center flex-col text-sm relative"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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
              <span>{t("cart_link_text")}</span>
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
      {/* Conditionally render CategoryMegaDropdown based on showMegaDropdown prop */}
      {showMegaDropdown && (
        <CategoryMegaDropdown style={{ outline: "2px solid red" }} />
      )}
    </>
  );
}

export default Header;
