import React from "react";
import { Link } from "react-router-dom";
import { useCategories } from "../context/CategoryContext";

const CategoryListPage = () => {
  const { categories, loading, error } = useCategories();

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading categories...</div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading categories.
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">No categories found.</div>
    );
  }

  // Filter for top-level categories (parent_id is null or 0, depending on your data)
  const topLevelCategories = categories.filter(
    (cat) => !cat.parent_id || cat.parent_id === 0
  );

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-800 border-b pb-4">
        All Categories
      </h1>
      {/* Using Grid for 3 columns per row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 items-start">
        {topLevelCategories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.id}`}
            className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 max-w-xs"
          >
            {category.image_url ? (
              <img
                src={`http://localhost:5000${category.image_url}`}
                alt={category.name}
                className="w-full h-40 object-cover"
              />
            ) : (
              // Placeholder for categories without images
              <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500">
                No Image
              </div>
            )}
            <div className="p-4 bg-gray-50 text-center">
              <h2 className="font-semibold text-lg text-gray-700">
                {category.name}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryListPage;
