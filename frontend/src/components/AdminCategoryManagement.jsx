import React, { useState, useEffect, useContext } from "react";
import AdminAuthContext from "../context/AdminAuthContext";

// Helper function to build a category tree
const buildCategoryTree = (categories, parentId = null) => {
  return categories
    .filter((category) => category.parent_id === parentId)
    .map((category) => ({
      ...category,
      children: buildCategoryTree(categories, category.id),
    }));
};

// Recursive component to render category tree nodes
const CategoryNode = ({ category }) => (
  <li>
    {category.name} {category.parent_id && `(Parent ID: ${category.parent_id})`}
    {/* Add Edit/Delete buttons here later */}
    {category.children.length > 0 && (
      <ul className="ml-4">
        {category.children.map((child) => (
          <CategoryNode key={child.id} category={child} />
        ))}
      </ul>
    )}
  </li>
);

function AdminCategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { adminToken } = useContext(AdminAuthContext);

  // Fetch categories from the backend
  const fetchCategories = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/categories");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      setError(error);
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle adding a new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch("http://localhost:5000/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: newCategoryName,
          parent_id: parentCategoryId || null, // Send null if no parent selected
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Assuming the backend returns the new category
      // const newCategory = await response.json();
      setNewCategoryName("");
      setParentCategoryId("");
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error("Error adding category:", error);
      // Optional: Display error message to user
    }
  };

  const categoryTree = buildCategoryTree(categories);

  if (loading) {
    return <div>Loading categories...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Category Management</h2>

      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} className="mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="New Category Name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="border px-3 py-2 rounded-md flex-1"
          />
          <select
            value={parentCategoryId}
            onChange={(e) => setParentCategoryId(e.target.value)}
            className="border px-3 py-2 rounded-md"
          >
            <option value="">-- Select Parent Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Add Category
          </button>
        </div>
      </form>

      {/* Category List (Hierarchical) */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Categories</h3>
        <ul>
          {categoryTree.map((category) => (
            <CategoryNode key={category.id} category={category} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AdminCategoryManagement;
