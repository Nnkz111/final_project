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

// Replace CategoryNode with a new version that supports expand/collapse and better visuals
const CategoryNode = ({ category, onEdit, onDelete, level = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  // Calculate border and background for nesting
  const borderColor = [
    "",
    "border-green-200 bg-green-50",
    "border-green-300 bg-green-100",
    "border-green-400 bg-green-50",
    "border-green-500 bg-green-100",
  ];
  const borderClass =
    level > 0 ? `${borderColor[level % borderColor.length]} border-l-4` : "";
  return (
    <li
      className={
        `flex flex-col py-1 ${borderClass}` + (level > 0 ? " pl-4" : "")
      }
    >
      <div className="flex items-center gap-2 group">
        {hasChildren && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="w-6 h-6 flex items-center justify-center text-green-600 hover:bg-green-100 rounded transition"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path
                  d="M18 15l-6-6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}
        <span
          className={`font-semibold text-gray-800 ${
            level === 0 ? "text-base" : "text-sm"
          }`}
        >
          {category.name}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => onEdit(category)}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow text-sm mr-2"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(category.id)}
          className="bg-red-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-red-700 transition duration-200 shadow text-sm"
        >
          Delete
        </button>
      </div>
      {hasChildren && expanded && (
        <ul className="mt-1">
          {category.children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

// Helper to render nested category options for the select
const renderCategoryOptions = (cats, level = 0, editingId = null) => {
  return cats.map((cat) => [
    <option
      key={cat.id}
      value={cat.id}
      disabled={editingId && cat.id === editingId}
    >
      {`${"\u00A0".repeat(level * 4)}${cat.name}`}
    </option>,
    cat.children && cat.children.length > 0
      ? renderCategoryOptions(cat.children, level + 1, editingId)
      : null,
  ]);
};

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
    <div className="min-h-[70vh] w-full flex flex-col items-center bg-gradient-to-br from-green-50 to-white py-12 px-2">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-8 border border-green-100">
        <h2 className="text-3xl font-extrabold text-green-700 mb-8 text-center">
          Category Management
        </h2>
        {/* Add/Edit Category Form */}
        <form
          onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}
          className="mb-8 p-6 border rounded-2xl bg-gray-50 border-green-100"
        >
          <h3 className="text-xl font-bold text-green-700 mb-4 text-center">
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
              className="border px-3 py-2 rounded-md flex-1 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <select
              value={
                editingCategory ? editedParentCategoryId : parentCategoryId
              }
              onChange={(e) =>
                editingCategory
                  ? setEditedParentCategoryId(e.target.value)
                  : setParentCategoryId(e.target.value)
              }
              className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Select Parent Category --</option>
              {renderCategoryOptions(
                categoryTree,
                0,
                editingCategory ? editingCategory.id : null
              )}
            </select>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center text-sm"
            >
              {editingCategory ? "Update Category" : "Add Category"}
            </button>
            {editingCategory && (
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 shadow text-center text-sm"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
        {/* Category List (Hierarchical) */}
        <div className="bg-white p-4 rounded-2xl shadow border border-green-100">
          <h3 className="text-lg font-bold text-green-700 mb-4">Categories</h3>
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
