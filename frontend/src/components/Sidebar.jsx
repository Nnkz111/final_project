import React, { useState } from "react";
import { useCategories } from "../context/CategoryContext"; // Import useCategories hook
import CategoryItem from "./CategoryItem"; // Import CategoryItem component

function Sidebar() {
  const { hierarchicalCategories, loading, error } = useCategories(); // Get hierarchical categories from context

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
    <aside className="relative w-64 p-6 bg-white shadow-md rounded-lg mr-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Categories</h2>
      <nav>
        <ul>
          {/* Render top-level categories using CategoryItem */}
          {hierarchicalCategories.map((category) => (
            <CategoryItem key={category.id} category={category} />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
