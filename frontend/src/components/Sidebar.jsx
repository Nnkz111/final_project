import React from "react";
import { useCategories } from "../context/CategoryContext"; // Import useCategories hook

function Sidebar() {
  const { categories, loading, error } = useCategories(); // Get categories, loading, and error from context

  if (loading) {
    return (
      <aside className="w-64 p-6 bg-white shadow-md rounded-lg mr-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Categories</h2>
        <div>Loading categories...</div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="w-64 p-6 bg-white shadow-md rounded-lg mr-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Categories</h2>
        <div className="text-red-600">Error loading categories.</div>
      </aside>
    );
  }

  return (
    <aside className="w-64 p-6 bg-white shadow-md rounded-lg mr-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Categories</h2>
      <nav>
        <ul>
          {categories.map((category) => (
            <li key={category.id} className="mb-2">
              <a href="#" className="text-gray-600 hover:text-red-600">
                {category.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
