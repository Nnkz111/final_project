import React, { useState, useRef, useEffect } from "react";
import { useCategories } from "../context/CategoryContext";
import { Link } from "react-router-dom";

function MegaSidebar() {
  const { hierarchicalCategories, loading } = useCategories();
  const [activeCategory, setActiveCategory] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const timeoutRef = useRef();

  // Handles hover with delay to prevent flicker
  const handleMouseEnter = (id) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveCategory(id);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveCategory(null), 200);
  };

  // When dropdown is active, match hero banner size and position
  useEffect(() => {
    if (activeCategory) {
      const banner = document.querySelector(".hero-banner");
      if (banner) {
        const rect = banner.getBoundingClientRect();
        setDropdownStyle({
          position: "fixed",
          left: rect.left + "px",
          top: rect.top + "px",
          width: rect.width + "px",
          height: rect.height + "px",
          zIndex: 50,
          pointerEvents: "auto",
        });
      }
    } else {
      setDropdownStyle({});
    }
  }, [activeCategory]);

  // Recursive render for submenus (columns)
  const renderSubMenu = (category, level = 2) => {
    if (!category.children || category.children.length === 0) return null;
    return (
      <ul className="space-y-1 mt-2">
        {category.children.map((sub) => (
          <li key={sub.id}>
            <Link
              to={`/category/${sub.id}`}
              className="block px-3 py-1.5 rounded-md text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors duration-200"
              style={{ fontWeight: level === 2 ? "bold" : "normal" }}
            >
              {sub.name}
            </Link>
            {renderSubMenu(sub, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return (
      <div className="w-64 bg-white border-r h-full flex items-center justify-center text-gray-500">
        Loading categories...
      </div>
    );
  }

  return (
    <div className="sidebar-menu w-64 bg-white border-r h-full shadow-md">
      <ul className="py-2">
        {hierarchicalCategories.map((cat) => (
          <li
            key={cat.id}
            onMouseEnter={() => handleMouseEnter(cat.id)}
            onMouseLeave={handleMouseLeave}
            className="relative"
          >
            <Link
              to={`/category/${cat.id}`}
              className={`flex items-center gap-2 px-4 py-3 w-full text-left text-gray-700 font-medium transition-colors duration-200 rounded-none border-l-4 ${
                activeCategory === cat.id
                  ? "bg-red-50 text-red-600 border-red-500"
                  : "hover:bg-gray-100 hover:text-red-600 border-transparent"
              }`}
              style={{ fontWeight: 500 }}
            >
              {/* You can add an icon here if you want */}
              {cat.name}
            </Link>
            {cat.children &&
              cat.children.length > 0 &&
              activeCategory === cat.id && (
                <div
                  className="fixed bg-white shadow-xl rounded-lg border flex gap-8 p-8 transition-all duration-300 ease-in-out opacity-100 animate-fade-in"
                  style={dropdownStyle}
                  onMouseEnter={() => handleMouseEnter(cat.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  {cat.children.map((sub) => (
                    <div key={sub.id} className="min-w-[160px]">
                      <Link
                        to={`/category/${sub.id}`}
                        className="block mb-2 text-gray-900 font-semibold text-base hover:text-red-600 transition-colors duration-200"
                      >
                        {sub.name}
                      </Link>
                      {renderSubMenu(sub, 3)}
                    </div>
                  ))}
                </div>
              )}
          </li>
        ))}
      </ul>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease;
        }
      `}</style>
    </div>
  );
}

export default MegaSidebar;
