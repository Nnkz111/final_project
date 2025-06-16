import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCategories } from "../context/CategoryContext";
import { useTranslation } from "react-i18next";

function CategoryMegaDropdown({ onCategoryClick }) {
  const { hierarchicalCategories, loading } = useCategories();
  const [activeCategory, setActiveCategory] = useState(null);
  const { t } = useTranslation();
  const timeoutRef = useRef();
  const containerRef = useRef();

  // Handle mouse movement within the dropdown
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 100);
  };

  const handleMouseEnter = (categoryId) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setActiveCategory(categoryId);
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return <div className="text-white p-4">Loading...</div>;
  }

  return (
    <nav className="w-full" ref={containerRef}>
      <div className="container mx-auto flex">
        {/* Left side - Parent categories */}
        <div className="w-1/4 border-r border-gray-700">
          <ul className="py-4">
            {hierarchicalCategories.map((category) => (
              <li
                key={category.id}
                className="relative"
                onMouseEnter={() => handleMouseEnter(category.id)}
              >
                <Link
                  to={`/category/${category.id}`}
                  className={`block px-6 py-3 text-white hover:text-green-400 hover:bg-gray-700/50 transition-colors duration-200 ${
                    activeCategory === category.id
                      ? "bg-gray-700/50 text-green-400"
                      : ""
                  }`}
                  onClick={onCategoryClick}
                >
                  {t(`category_${category.name}`, category.name)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Right side - Subcategories */}
        <div
          className="w-3/4 min-h-[300px]"
          onMouseEnter={() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
          }}
        >
          {hierarchicalCategories.map(
            (category) =>
              activeCategory === category.id &&
              category.children && (
                <div key={category.id} className="p-6 grid grid-cols-3 gap-8">
                  {category.children.map((subCategory) => (
                    <div key={subCategory.id} className="space-y-4">
                      <Link
                        to={`/category/${subCategory.id}`}
                        className="text-white hover:text-green-400 font-medium block"
                        onClick={onCategoryClick}
                      >
                        {t(`category_${subCategory.name}`, subCategory.name)}
                      </Link>
                      {subCategory.children &&
                        subCategory.children.length > 0 && (
                          <ul className="space-y-2">
                            {subCategory.children.map((subSubCategory) => (
                              <li key={subSubCategory.id}>
                                <Link
                                  to={`/category/${subSubCategory.id}`}
                                  className="text-gray-400 hover:text-green-400 text-sm block"
                                  onClick={onCategoryClick}
                                >
                                  {t(
                                    `category_${subSubCategory.name}`,
                                    subSubCategory.name
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                  ))}
                </div>
              )
          )}
        </div>
      </div>
    </nav>
  );
}

export default CategoryMegaDropdown;
