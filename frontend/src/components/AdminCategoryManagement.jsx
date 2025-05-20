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
const CategoryNode = ({ category, onEdit, onDelete }) => (
  <li className="mb-2 border-b pb-2 last:border-b-0 flex justify-between items-center">
    <span>
      {category.name}
      {category.parent_id && (
        <span className="ml-2 text-gray-500 text-sm">
          (Parent ID: {category.parent_id})
        </span>
      )}
    </span>
    {/* Buttons Container */}
    <div>
      <button
        onClick={() => onEdit(category)}
        className="text-blue-600 hover:text-blue-800 text-sm mr-2"
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(category.id)}
        className="text-red-600 hover:text-red-800 text-sm"
      >
        Delete
      </button>
    </div>
    {category.children.length > 0 && (
      <ul className="ml-6 mt-2 border-l pl-4">
        {category.children.map((child) => (
          <CategoryNode
            key={child.id}
            category={child}
            onEdit={onEdit}
            onDelete={onDelete}
          />
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
  const [editingCategory, setEditingCategory] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [editedParentCategoryId, setEditedParentCategoryId] = useState("");

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

  // Handle click on Edit button
  const handleEditClick = (category) => {
    setEditingCategory(category);
    setEditedCategoryName(category.name);
    setEditedParentCategoryId(category.parent_id || ""); // Use empty string for null parent_id
  };

  // Handle updating a category
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editedCategoryName.trim() || !editingCategory) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/categories/${editingCategory.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: editedCategoryName,
            parent_id: editedParentCategoryId || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Assuming the backend returns the updated category
      // const updatedCategory = await response.json();
      setEditingCategory(null); // Exit editing mode
      setEditedCategoryName("");
      setEditedParentCategoryId("");
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error("Error updating category:", error);
      // Optional: Display error message to user
    }
  };

  // Handle deleting a category
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/categories/${categoryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Assuming successful deletion
      fetchCategories(); // Refresh the list
    } catch (error) {
      console.error("Error deleting category:", error);
      // Optional: Display error message to user
    }
  };

  const categoryTree = buildCategoryTree(categories);

  if (loading) {
    return <div className="p-6">Loading categories...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error.message}</div>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Category Management
      </h2>

      {/* Add/Edit Category Form */}
      <form
        onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}
        className="mb-8 p-4 border rounded-md bg-gray-50"
      >
        <h3 className="text-xl font-semibold mb-4 text-gray-700">
          {editingCategory ? "Edit Category" : "Add New Category"}
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder={
              editingCategory ? "Edit Category Name" : "New Category Name"
            }
            value={editingCategory ? editedCategoryName : newCategoryName}
            onChange={(e) =>
              editingCategory
                ? setEditedCategoryName(e.target.value)
                : setNewCategoryName(e.target.value)
            }
            className="border px-3 py-2 rounded-md flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={editingCategory ? editedParentCategoryId : parentCategoryId}
            onChange={(e) =>
              editingCategory
                ? setEditedParentCategoryId(e.target.value)
                : setParentCategoryId(e.target.value)
            }
            className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Parent Category --</option>
            {categories.map((cat) => (
              // Prevent selecting the category itself or its descendants as parent during edit
              <option
                key={cat.id}
                value={cat.id}
                disabled={
                  editingCategory &&
                  (cat.id === editingCategory.id ||
                    isDescendant(categories, cat, editingCategory))
                }
              >
                {cat.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200"
          >
            {editingCategory ? "Update Category" : "Add Category"}
          </button>
          {editingCategory && (
            <button
              type="button"
              onClick={() => setEditingCategory(null)}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition duration-200"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* Category List (Hierarchical) */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Categories</h3>
        <ul>
          {categoryTree.map((category) => (
            <CategoryNode
              key={category.id}
              category={category}
              onEdit={handleEditClick}
              onDelete={handleDeleteCategory}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

// Helper function to check if a category is a descendant of another
const isDescendant = (categories, possibleDescendant, possibleAncestor) => {
  let currentCategory = possibleDescendant;
  while (currentCategory) {
    if (currentCategory.parent_id === possibleAncestor.id) {
      return true;
    }
    // Find the parent category in the flat list
    currentCategory = categories.find(
      (cat) => cat.id === currentCategory.parent_id
    );
  }
  return false;
};

export default AdminCategoryManagement;
