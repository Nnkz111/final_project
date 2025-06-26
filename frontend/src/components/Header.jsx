import React, { useEffect, useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import AuthContext from "../context/AuthContext";
import { useCategories } from "../context/CategoryContext";
import { useLocation, useNavigate } from "react-router-dom";
import "flag-icons/css/flag-icons.min.css";
import { useTranslation } from "react-i18next";
import {
  getUserNotifications,
  markNotificationAsRead,
} from "../api/notificationApi"; // Import API functions
import {
  FaShoppingCart,
  FaBoxOpen,
  FaTimesCircle,
  FaInfoCircle,
} from "react-icons/fa";

function Header() {
  const { cartItemCount } = useCart(); // Get count from context
  const { user, logout, token } = useContext(AuthContext); // Get user, logout, AND token from AuthContext
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { t, i18n } = useTranslation(); // Get the t and i18n instance
  const [langDropdownOpen, setLangDropdownOpen] = useState(false); // State for language dropdown
  const [notificationOpen, setNotificationOpen] = useState(false); // State for notification dropdown
  const [notifications, setNotifications] = useState([]); // State to store notifications
  const [unreadCount, setUnreadCount] = useState(0); // State to store unread notification count
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Call the customer logout function from AuthContext
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm(""); // Clear the search input after search
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

  const handleNotificationClick = async (notification) => {
    // Always mark as read when clicked
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === "new_order" && notification.order_id) {
      navigate(`/admin/orders`); // New orders link to admin orders page
    } else if (notification.type === "low_stock" && notification.product_id) {
      navigate(`/admin/products`); // Low stock link to admin products page
    } else if (
      notification.type === "order_cancelled" &&
      notification.order_id
    ) {
      navigate(`/admin/orders?status=cancelled`); // Admin sees cancelled orders with filter
    } else if (
      notification.type === "order_cancelled_customer" &&
      notification.order_id
    ) {
      navigate(`/my-orders`); // Customer sees their cancelled order in My Orders
    } else if (
      notification.type === "customer_order_placed" &&
      notification.order_id
    ) {
      navigate(`/order-confirmation/${notification.order_id}`); // Customer's new order message directs to order confirmation
    } else if (
      notification.type === "order_status_update" &&
      notification.order_id
    ) {
      navigate(`/order-confirmation/${notification.order_id}`); // Order status update directs to order confirmation
    } else if (notification.order_id) {
      navigate(`/my-orders`); // Default for other types with an order_id
    } else {
      navigate(`/`); // Default for types without an order_id
    }
    setNotificationOpen(false); // Close dropdown after click
  };

  // Filter out read notifications for display in dropdown
  const unreadNotifications = notifications.filter((notif) => !notif.is_read);

  // Sort unread notifications: new orders first, then low stock, then others, all by date
  unreadNotifications.sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);

    if (a.type === "new_order" && b.type !== "new_order") return -1;
    if (b.type === "new_order" && a.type !== "new_order") return 1;
    if (a.type === "low_stock" && b.type !== "low_stock") return -1;
    if (b.type === "low_stock" && a.type !== "low_stock") return 1;
    if (a.type === "order_cancelled" && b.type !== "order_cancelled") return -1;
    if (b.type === "order_cancelled" && a.type !== "order_cancelled") return 1;
    if (
      a.type === "order_cancelled_customer" &&
      b.type !== "order_cancelled_customer"
    )
      return -1;
    if (
      b.type === "order_cancelled_customer" &&
      a.type !== "order_cancelled_customer"
    )
      return 1;

    return dateB - dateA; // Sort by date for same types
  });

  return (
    <div className="hidden md:block w-full bg-gray-800">
      <div className="container mx-auto">
        <header className="flex items-center justify-between p-4 text-white">
          <div className="w-1/8 flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img
                src="https://res.cloudinary.com/dgfk0ljyq/image/upload/v1749228072/web_icon_t8i1f2.png"
                alt="MR.IT Logo"
                className="h-14 w-14 rounded-full"
              />
              <span className="text-3xl font-bold ml-2">MR.IT</span>
            </Link>
          </div>

          <div className="w-2/4 flex items-center bg-white rounded-md overflow-hidden">
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

          {/* User/Cart Icons Area - fixed width */}
          <div className="w-1/4 flex items-center justify-end space-x-6">
            {/* Language Switcher Dropdown */}
            <div
              className="relative flex flex-col items-center gap-1"
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
                <div className="absolute right-0 top-5 w-30 bg-white text-gray-800 rounded-md shadow-lg z-[60]">
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
                className="relative group flex items-center cursor-pointer"
                onMouseEnter={() => setNotificationOpen(true)}
                onMouseLeave={() => setNotificationOpen(false)}
              >
                <div className="flex flex-col items-center gap-1">
                  <button className="flex items-center justify-center focus:outline-none relative">
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
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform bg-red-600 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <span className="text-sm">{t("notifications")}</span>
                </div>
                {/* Notification Dropdown Menu */}
                {notificationOpen && (
                  <div
                    className={`absolute right-0 top-full w-64 bg-white text-gray-800 rounded-lg shadow-lg border border-gray-200 z-[51] transition-all duration-200 origin-top-right  ${
                      notificationOpen
                        ? "opacity-100 scale-100 pointer-events-auto"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  >
                    <div className="px-4 py-3 font-bold border-b border-gray-200 ">
                      {t("notifications")}
                    </div>
                    <div className="py-2 max-h-60 overflow-y-auto">
                      {unreadNotifications.length === 0 ? (
                        <p className="px-4 py-2 text-sm text-gray-500">
                          {t("no_new_notifications")}
                        </p>
                      ) : (
                        <ul>
                          {unreadNotifications.map((notification) => (
                            <li
                              key={notification.id}
                              className="px-4 py-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0 cursor-pointer"
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                            >
                              <div className="flex items-center">
                                {notification.type === "new_order" ? (
                                  <FaShoppingCart className="mr-3 text-xl text-green-600" />
                                ) : notification.type === "low_stock" ? (
                                  <FaBoxOpen className="mr-3 text-xl text-red-600" />
                                ) : notification.type ===
                                  "order_cancelled_customer" ? (
                                  <FaTimesCircle className="mr-3 text-xl text-yellow-600" />
                                ) : notification.type ===
                                  "customer_order_placed" ? (
                                  <FaShoppingCart className="mr-3 text-xl text-blue-600" />
                                ) : notification.type ===
                                  "order_status_update" ? (
                                  <FaInfoCircle className="mr-3 text-xl text-blue-600" />
                                ) : notification.type ===
                                  "shipping_bill_uploaded" ? (
                                  <FaInfoCircle className="mr-3 text-xl text-green-600" />
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 mr-3 text-gray-500"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {t(`notification.${notification.type}`, {
                                      orderId: notification.order_id,
                                      productName:
                                        notification.product_name ||
                                        notification.name,
                                      stockQuantity:
                                        notification.stock_quantity,
                                      message: notification.message,
                                      status: notification.order_status
                                        ? t(
                                            `order_status_${notification.order_status}`
                                          )
                                        : "",
                                    })}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(
                                      notification.created_at
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200 text-center">
                      <Link
                        to="/my-orders"
                        className="block px-4 py-3 text-center text-blue-600 hover:bg-blue-50 border-t border-gray-200"
                      >
                        {t("view_all_notifications")}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Icon and Dropdown */}
            {user ? (
              <div
                className="relative group flex items-center"
                onMouseEnter={() => setProfileOpen(true)}
                onMouseLeave={() => setProfileOpen(false)}
              >
                <div className="flex flex-col items-center gap-1 cursor-pointer">
                  <button className="flex items-center justify-center focus:outline-none ">
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
                  </button>{" "}
                  <span className="text-sm">
                    {user?.customer?.name || user?.username || t("my_profile")}
                  </span>
                </div>
                <svg
                  className={`h-4 w-4 ml-1 transition-transform duration-200 ${
                    profileOpen ? "rotate-180" : "rotate-0"
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
                {/* Dropdown menu - Increased z-index to appear above category dropdowns */}
                {profileOpen && (
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
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex flex-col items-center gap-1 text-sm"
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
            )}

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="flex flex-col items-center gap-1 text-sm relative"
            >
              <div className="relative">
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
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 transform bg-red-600 rounded-full">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span>{t("cart_link_text")}</span>
            </Link>
          </div>
        </header>
      </div>
    </div>
  );
}

export default Header;
