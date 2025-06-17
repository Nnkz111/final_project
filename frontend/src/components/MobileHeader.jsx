import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCart } from "../context/CartContext";
import { useCategories } from "../context/CategoryContext";
import AuthContext from "../context/AuthContext";
import { useContext } from "react";

const MobileHeader = () => {
  const { t, i18n } = useTranslation();
  const { cartItemCount } = useCart();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { hierarchicalCategories } = useCategories();
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setShowSearch(false);
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "lo" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <>
      {/* Main Header */}
      <header className="bg-gray-800 text-white py-2 px-4 fixed top-0 left-0 right-0 z-50 md:hidden">
        <div className="flex items-center justify-between h-12">
          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2"
            aria-label="Menu"
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
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="https://res.cloudinary.com/dgfk0ljyq/image/upload/v1749228072/web_icon_t8i1f2.png"
              alt="MR.IT Logo"
              className="h-8 w-8 rounded-full"
            />
            <span className="text-xl font-bold ml-2">MR.IT</span>
          </Link>

          {/* Search Toggle Button */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2"
            aria-label="Search"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>

        {/* Search Bar - Slides down when active */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            showSearch ? "h-12 mt-2" : "h-0"
          }`}
        >
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("search_placeholder")}
              className="flex-1 px-4 py-2 text-gray-900 rounded-l-md focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md"
            >
              {t("search")}
            </button>
          </form>
        </div>
      </header>

      {/* Slide-in Menu */}
      <div className={`fixed inset-0 z-50 ${isMenuOpen ? "block" : "hidden"}`}>
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Menu Content */}
        <div className="absolute top-0 left-0 w-4/5 h-full bg-white transform transition-transform duration-300">
          <div className="flex flex-col h-full">
            {/* Menu Header */}
            <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
              {user ? (
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2"
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
                  <span>{user?.customer?.name || user?.username}</span>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  {t("login_link_text")}
                </Link>
              )}
              <button onClick={() => setIsMenuOpen(false)} className="p-2">
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto">
              {/* Categories */}
              <div className="p-4">
                <Link
                  to="/categories"
                  className="block mb-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <h3 className="text-lg font-semibold mb-2">
                    {t("Category")}
                  </h3>
                </Link>
                <ul className="space-y-2">
                  {hierarchicalCategories.map((category) => (
                    <li key={category.id}>
                      <Link
                        to={`/category/${category.id}`}
                        className="block py-2 text-gray-600 hover:text-blue-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t(`category_${category.name}`, category.name)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Language Switch */}

              <div className="p-4 border-t ">
                <div classname=" flex items-center p-4 space-x-2 rounded-md">
                  {t("change_language")}
                </div>
                <button
                  onClick={() => {
                    toggleLanguage();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 text-gray-600 mt-2"
                >
                  <span
                    className={`fi fi-${i18n.language === "en" ? "us" : "la"}`}
                  ></span>
                  <span>{i18n.language === "en" ? "English" : "ລາວ"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[56px]" />
    </>
  );
};

export default MobileHeader;
