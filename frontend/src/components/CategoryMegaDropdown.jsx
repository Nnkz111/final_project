import React, { useState } from "react";
import { useCategories } from "../context/CategoryContext";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

function CategoryMegaDropdown() {
  const { hierarchicalCategories } = useCategories();
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const location = useLocation();
  const { t } = useTranslation();

  // Helper to render nested subcategories vertically within a column
  const renderVerticalChildren = (category) => {
    if (!category.children || category.children.length === 0) return null;
    return (
      <ul className="mt-2 space-y-1">
        {category.children.map((sub) => (
          <li key={sub.id}>
            <Link
              to={`/category/${sub.id}`}
              className="text-gray-600 hover:text-blue-700 transition-colors block px-2 py-1 rounded hover:bg-blue-50 text-sm"
              onClick={() => setOpen(false)}
            >
              {sub.name}
            </Link>
            {/* Recursively render further nested children vertically */}
            {renderVerticalChildren(sub)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="relative w-full z-40 sticky top-[64px]">
      <div
        className="bg-gray-800 text-white font-bold px-8 py-3 cursor-pointer flex items-center gap-2 select-none"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-lg">{t("category_megadropdown_categories")}</span>
        <svg
          className={`w-5 h-5 ml-2 transition-transform ${
            open ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      {open && (
        <div
          className="absolute left-0 w-full bg-white shadow-2xl rounded-b-xl border-t border-gray-200 flex mt-0 animate-fade-in"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {/* Left: Category list (Top-level) */}
          <div className="w-64 bg-white border-r p-4 max-h-[420px] overflow-y-auto">
            <ul className="space-y-1">
              {hierarchicalCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/category/${cat.id}`}
                    className={`flex items-center w-full px-3 py-2 rounded text-left transition font-medium text-gray-700 hover:bg-blue-100 hover:text-blue-600 ${
                      activeCategory === cat.id
                        ? "bg-blue-50 text-blue-600"
                        : ""
                    }`}
                    onMouseEnter={() => setActiveCategory(cat.id)}
                    onFocus={() => setActiveCategory(cat.id)}
                    onClick={() => setOpen(false)}
                  >
                    {t(`category_${cat.name}`, cat.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Right: Direct Subcategories in Horizontal Columns, with their children Vertical */}
          <div className="flex-1 p-6 min-h-[420px]">
            {activeCategory ? (
              <>
                {/* Direct children of the active category (Horizontal Columns) */}
                <div className="flex flex-row gap-8">
                  {hierarchicalCategories
                    .find((c) => c.id === activeCategory)
                    ?.children.map((directChild) => (
                      <div key={directChild.id} className="flex-shrink-0 w-48">
                        {/* Link for the direct child (Column Header) */}
                        <Link
                          to={`/category/${directChild.id}`}
                          className="font-bold text-gray-800 hover:text-blue-700 transition-colors block px-2 py-1 rounded hover:bg-blue-50"
                          onClick={() => setOpen(false)}
                        >
                          {t(`category_${directChild.name}`, directChild.name)}
                        </Link>
                        {/* Render nested children vertically under this direct child */}
                        {renderVerticalChildren(directChild)}
                      </div>
                    ))}
                  {/* Handle case where a top-level category has no direct children but might have products */}
                  {hierarchicalCategories.find((c) => c.id === activeCategory)
                    ?.children.length === 0 && (
                    <div className="text-gray-500">
                      {t("category_megadropdown_no_subcategories")}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-lg flex items-center h-full">
                {t("category_megadropdown_hover_prompt")}
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease;
        }
      `}</style>
    </div>
  );
}

export default CategoryMegaDropdown;
