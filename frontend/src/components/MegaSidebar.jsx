import React, { useState, useRef, useEffect } from "react";
import { useCategories } from "../context/CategoryContext";
import { Link } from "react-router-dom";

function MegaSidebar({ bannerHeight }) {
  const { hierarchicalCategories, loading } = useCategories();
  const [activeCategory, setActiveCategory] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const timeoutRef = useRef();
  const sidebarRef = useRef(null);

  // Handles hover with delay to prevent flicker
  const handleMouseEnter = (id) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveCategory(id);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveCategory(null), 200);
  };

  // When dropdown is active, position it relative to the sidebar
  useEffect(() => {
    if (activeCategory && sidebarRef.current) {
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        left: sidebarRect.right + "px",
        top: sidebarRect.top + "px", // Align top with sidebar top
        width: `calc(92vw - ${sidebarRect.right}px)`, // Calculate width to fill the rest of the viewport
        height: `${bannerHeight}px`, // Match height of the banner area
        zIndex: 60,
        pointerEvents: "auto",
        backgroundColor: "white", // Ensure background is white
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)", // Tailwind shadow-xl
        borderRadius: "0 0.5rem 0.5rem 0", // Rounded corners only on right/bottom
        border: "1px solid #e5e7eb", // Tailwind border-gray-200
        display: "flex", // Use flex for inner layout
        gap: "2rem", // Tailwind gap-8
        padding: "2rem", // Tailwind p-8
        transition: "all 0.3s ease-in-out",
        opacity: 1,
        animation: "fade-in 0.25s ease",
      });
    } else {
      setDropdownStyle({});
    }
  }, [activeCategory, bannerHeight]);

  // Recursive render for submenus (columns)
  const renderSubMenu = (category, level = 2) => {
    if (!category.children || category.children.length === 0) return null;
    return (
      <ul className="space-y-1 mt-2">
        {category.children.map((sub) => (
          <li key={sub.id}>
            <Link
              to={`/category/${sub.id}`}
              className="block px-3 py-1.5 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
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
    <div
      className="sidebar-menu w-64 bg-white border-r h-full shadow-md"
      ref={sidebarRef}
    >
      <ul className="py-2 w-64">
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
                  ? "bg-blue-50 text-blue-600 border-blue-500"
                  : "hover:bg-blue-50 hover:text-blue-600 border-transparent"
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
                  className=""
                  style={dropdownStyle}
                  onMouseEnter={() => handleMouseEnter(cat.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  {cat.children.map((sub) => (
                    <div key={sub.id} className="min-w-[160px]">
                      <Link
                        to={`/category/${sub.id}`}
                        className="block mb-2 text-gray-900 font-semibold text-base hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
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
