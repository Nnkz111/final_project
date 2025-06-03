import React, { useEffect, useContext, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext"; // Import useCart hook
import AuthContext from "../context/AuthContext"; // Import AuthContext
import { useCategories } from "../context/CategoryContext";
import { useLocation, useNavigate } from "react-router-dom";
import CategoryMegaDropdown from "./CategoryMegaDropdown";
import { useTranslation } from "react-i18next"; // Import useTranslation

function Header({ showMegaDropdown }) {
  const { cartItemCount } = useCart(); // Get count from context
  const { user, logout } = useContext(AuthContext); // Get user and logout from AuthContext
  const [profileOpen, setProfileOpen] = useState(false);
  const { hierarchicalCategories, loading } = useCategories();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { t, i18n } = useTranslation(); // Get the t and i18n instance
  const [langDropdownOpen, setLangDropdownOpen] = useState(false); // State for language dropdown

  // No need to manually fetch or refresh here due to useEffect in CartContext

  const handleLogout = () => {
    logout(); // Call the customer logout function from AuthContext
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Dropdown menu for categories
  const renderCategoryDropdown = () => (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm z-40 sticky top-[64px]">
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
      <header className="bg-black text-white p-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo Area - now clickable */}
          <Link
            to="/"
            className="text-3xl font-bold mr-6 hover:opacity-80 transition-opacity"
          >
            MR.IT
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 32 24"
                  >
                    <mask
                      id="flagpackUs0"
                      width="32"
                      height="24"
                      x="0"
                      y="0"
                      maskUnits="userSpaceOnUse"
                    >
                      <path fill="#fff" d="M0 0h32v24H0z" />
                    </mask>
                    <g fill="none" mask="url(#flagpackUs0)">
                      <path
                        fill="#F7FCFF"
                        fillRule="evenodd"
                        d="M0 0h32v24H0V0z"
                        clipRule="evenodd"
                      />
                      <path
                        fill="#E31D1C"
                        fillRule="evenodd"
                        d="M0 14.667v2h32v-2H0zm0 3.666v2h32v-2H0zm0-11v2h32v-2H0zM0 22v2h32v-2H0zm0-11v2h32v-2H0zM0 0v2h32V0H0zm0 3.667v2h32v-2H0z"
                        clipRule="evenodd"
                      />
                      <path fill="#2E42A5" d="M0 0h20v13H0z" />
                      <path
                        fill="#F7FCFF"
                        fillRule="evenodd"
                        d="m1.722 2.939l-.726.509l.245-.906l-.645-.574h.843l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm4 0l-.726.509l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm3.274.509l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.842l.644.574l-.245.906zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zM.996 7.449l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74H.596l.645.574l-.245.906zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm3.274.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.842l.644.574l-.245.906zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zM.996 11.449l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74H.596l.645.574l-.245.905zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.905l-.702-.508zm3.274.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.842l.644.574l-.245.905zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.905l-.702-.508zm3.274-7.49l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.843l.645.574l-.245.906zm.726 3.49l-.726.51l.245-.906l-.645-.574h.843l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm-.726 4.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.843l.645.574l-.245.905zM3.722 4.938l-.726.51l.245-.906l-.645-.574h.843l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm3.274.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.843l.645.574l-.245.906zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm-8.726 4.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.843l.645.574l-.245.906zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm3.274.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.842l.644.574l-.245.906zm4.726-4.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm-.726 4.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.842l.644.574l-.245.906z"
                        clipRule="evenodd"
                      />
                    </g>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 512 512"
                    className="rounded-full h-5 w-5"
                  >
                    <mask id="circleFlagsLa0">
                      <circle cx="256" cy="256" r="256" fill="#fff" />
                    </mask>
                    <g mask="url(#circleFlagsLa0)">
                      <path
                        fill="#d80027"
                        d="M0 0h512v144.8l-45.8 113L512 367.4V512H0V367.4l46.3-111.1L0 144.8z"
                      />
                      <path fill="#0052b4" d="M0 144.8h512v222.6H0z" />
                      <circle cx="256" cy="256.1" r="89" fill="#eee" />
                    </g>
                  </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 32 24"
                    >
                      <mask
                        id="flagpackUs0"
                        width="32"
                        height="24"
                        x="0"
                        y="0"
                        maskUnits="userSpaceOnUse"
                      >
                        <path fill="#fff" d="M0 0h32v24H0z" />
                      </mask>
                      <g fill="none" mask="url(#flagpackUs0)">
                        <path
                          fill="#F7FCFF"
                          fillRule="evenodd"
                          d="M0 0h32v24H0V0z"
                          clipRule="evenodd"
                        />
                        <path
                          fill="#E31D1C"
                          fillRule="evenodd"
                          d="M0 14.667v2h32v-2H0zm0 3.666v2h32v-2H0zm0-11v2h32v-2H0zM0 22v2h32v-2H0zm0-11v2h32v-2H0zM0 0v2h32V0H0zm0 3.667v2h32v-2H0z"
                          clipRule="evenodd"
                        />
                        <path fill="#2E42A5" d="M0 0h20v13H0z" />
                        <path
                          fill="#F7FCFF"
                          fillRule="evenodd"
                          d="m1.722 2.939l-.726.509l.245-.906l-.645-.574h.843l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm4 0l-.726.509l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm3.274.509l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.842l.644.574l-.245.906zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zM.996 7.449l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74H.596l.645.574l-.245.906zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm3.274.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.842l.644.574l-.245.906zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zM.996 11.449l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74H.596l.645.574l-.245.905zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.905l-.702-.508zm3.274.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.842l.644.574l-.245.905zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.905l-.702-.508zm3.274-7.49l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.843l.645.574l-.245.906zm.726 3.49l-.726.51l.245-.906l-.645-.574h.843l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm-.726 4.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.843l.645.574l-.245.905zM3.722 4.938l-.726.51l.245-.906l-.645-.574h.843l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm3.274.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.843l.645.574l-.245.906zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm-8.726 4.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.843l.645.574l-.245.906zm4.726-.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm3.274.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.842l.644.574l-.245.906zm4.726-4.51l-.726.51l.245-.906l-.644-.574h.842l.282-.74l.331.74h.718l-.564.574l.218.906l-.702-.51zm-.726 4.51l.726-.51l.702.51l-.218-.906l.564-.574h-.718l-.331-.74l-.282.74h-.842l.644.574l-.245.906z"
                          clipRule="evenodd"
                        />
                      </g>
                    </svg>
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="22"
                      height="22"
                      viewBox="0 0 512 512"
                    >
                      <mask id="circleFlagsLa0">
                        <circle cx="256" cy="256" r="256" fill="#fff" />
                      </mask>
                      <g mask="url(#circleFlagsLa0)">
                        <path
                          fill="#d80027"
                          d="M0 0h512v144.8l-45.8 113L512 367.4V512H0V367.4l46.3-111.1L0 144.8z"
                        />
                        <path fill="#0052b4" d="M0 144.8h512v222.6H0z" />
                        <circle cx="256" cy="256.1" r="89" fill="#eee" />
                      </g>
                    </svg>
                    ລາວ
                  </button>
                </div>
              )}
            </div>
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
                  <span>{user.username}</span>
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

            {/* Cart Icon with item count - ONLY show if customer is logged in */}
            {user && ( // Conditionally render cart icon if user is logged in (customer)
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
                <span>{t("cart_link_text")}</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      {/* Conditionally render CategoryMegaDropdown based on showMegaDropdown prop */}
      {showMegaDropdown && <CategoryMegaDropdown />}
    </>
  );
}

export default Header;
