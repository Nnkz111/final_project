import React, { useRef, useState, useEffect } from "react";

const CategoryItem = ({ category }) => {
  const [isActive, setIsActive] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const timeoutRef = useRef();

  // Check if the category has children
  const hasChildren = category.children && category.children.length > 0;

  // Desktop hover logic with delay (prevents flicker)
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsActive(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
    }, 200); // 200ms delay before hiding
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // When dropdown is active, match hero banner size and position
  useEffect(() => {
    if (isActive && hasChildren) {
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
        });
      }
    } else {
      setDropdownStyle({});
    }
  }, [isActive, hasChildren]);

  return (
    <li
      className="w-full relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ margin: 0, padding: 0 }}
    >
      <button
        type="button"
        className={
          `w-full block px-4 py-2 text-left text-gray-700 transition-all duration-200 ease-in-out ` +
          (isActive
            ? "bg-red-50 text-red-500 font-semibold"
            : "hover:bg-gray-100 hover:text-red-600")
        }
        style={{ minWidth: 0, borderRadius: 0 }}
      >
        {category.name}
      </button>
      {isActive && hasChildren && (
        <div
          className="bg-white shadow-lg rounded-r-lg p-4 border-t border-b border-r flex items-stretch transition-all duration-200 ease-in-out"
          style={dropdownStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <ul className="mt-1 space-y-1 w-full">
            {category.children.map((subCategory) => (
              <li key={subCategory.id}>
                <a
                  href="#"
                  className="block rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                >
                  {subCategory.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

export default CategoryItem;
