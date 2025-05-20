import React, { useState } from "react";

const CategoryItem = ({ category }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Check if the category has children
  const hasChildren = category.children && category.children.length > 0;

  return (
    <li
      className="mb-2 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a href="#" className="text-gray-600 hover:text-red-600">
        {category.name}
      </a>

      {/* Recursively render children if hovered and children exist */}
      {isHovered && hasChildren && (
        <ul className="absolute left-full top-0 ml-2 w-48 bg-white shadow-md rounded-lg p-2 z-10">
          {category.children.map((subCategory) => (
            // Render sub-categories using the same CategoryItem component
            <CategoryItem key={subCategory.id} category={subCategory} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default CategoryItem;
