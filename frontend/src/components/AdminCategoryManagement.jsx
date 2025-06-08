import React, { useState, useEffect, useContext } from "react";
import AdminAuthContext from "../context/AdminAuthContext";
import ConfirmationModal from "./ConfirmationModal";
import { useTranslation } from "react-i18next";

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
const CategoryNode = ({ category, onEdit, onDelete, level = 0, t }) => {
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
            aria-label={
              expanded
                ? t("admin_category_management.collapse")
                : t("admin_category_management.expand")
            }
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
          {t(`category_${category.name}`, category.name)}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => onEdit(category)}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow text-sm mr-2"
        >
          {t("admin_category_management.edit_button")}
        </button>
        <button
          onClick={() => onDelete(category.id)}
          className="bg-red-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-red-700 transition duration-200 shadow text-sm"
        >
          {t("admin_category_management.delete_button")}
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
              t={t}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

// Helper to render nested category options for the select
const renderCategoryOptions = (cats, level = 0, editingId = null, t) => {
  return cats.map((cat) => [
    <option
      key={cat.id}
      value={cat.id}
      disabled={editingId && cat.id === editingId}
    >
      {`${"\u00A0".repeat(level * 4)}${t(`category_${cat.name}`, cat.name)}`}
    </option>,
    cat.children && cat.children.length > 0
      ? renderCategoryOptions(cat.children, level + 1, editingId, t)
      : null,
  ]);
};

function AdminCategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { adminToken } = useContext(AdminAuthContext);
  const { t } = useTranslation();

  // State for modal and form
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [categoryImage, setCategoryImage] = useState(null);
  const [categoryImageUrl, setCategoryImageUrl] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // State for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [actionToConfirm, setActionToConfirm] = useState(null); // Store the action to perform on confirm

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

  // Handle click on Edit button
  const handleEditClick = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setParentCategoryId(category.parent_id || "");
    setCategoryImageUrl(category.image_url || "");
    const imageUrlForPreview = category.image_url ? category.image_url : "";
    setPreviewImageUrl(imageUrlForPreview);
    setCategoryImage(null);
    setUploading(false);
    setShowModal(true);
  };

  // Handle file selection and immediate upload for preview
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setCategoryImage(file);
      setPreviewImageUrl(URL.createObjectURL(file));
      setCategoryImageUrl("");

      // Upload the image immediately after selection
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      try {
        const response = await fetch("http://localhost:5000/api/upload", {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!response.ok) {
          throw new Error("Upload failed");
        }
        const data = await response.json();
        setCategoryImageUrl(data.url);
      } catch (err) {
        alert(
          t("admin_category_management.image_upload_failed", {
            error: err.message,
          })
        );
        setPreviewImageUrl("");
        setCategoryImage(null);
        setCategoryImageUrl("");
      } finally {
        setUploading(false);
      }
    } else {
      // Clear states if file is deselected
      setCategoryImage(null);
      setPreviewImageUrl("");
      setCategoryImageUrl("");
    }
  };

  // Handle removing the image
  const handleRemoveImage = () => {
    setCategoryImage(null);
    setCategoryImageUrl("");
    setPreviewImageUrl("");
    // No need to set uploading to false here, as removal is instant
  };

  // Handle form submission (Add or Edit)
  const handleSubmit = async () => {
    if (!categoryName.trim()) return;

    // Image upload already happened on file select, categoryImageUrl should hold the backend URL

    const method = editingCategory ? "PUT" : "POST";
    const url = editingCategory
      ? `http://localhost:5000/api/categories/${editingCategory.id}`
      : "http://localhost:5000/api/categories";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: categoryName,
          parent_id: parentCategoryId || null,
          image_url: categoryImageUrl || null, // <--- Use the backend URL from state
        }),
      });

      if (!response.ok) {
        // If backend returns an error, log the response body
        const errorData = await response.json();
        console.error("Backend error saving category:", errorData);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${
            errorData.error || "Unknown error"
          }`
        );
      }

      setShowModal(false); // Close the add/edit modal
      fetchCategories(); // Refresh the list
      // Close confirmation modal
      setIsConfirmModalOpen(false);
      setActionToConfirm(null);
    } catch (error) {
      console.error("Error saving category:", error);
      alert(
        t(
          editingCategory
            ? "admin_category_management.update_failed"
            : "admin_category_management.add_failed",
          { error: error.message }
        )
      );
      // Close confirmation modal even on error
      setIsConfirmModalOpen(false);
      setActionToConfirm(null);
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (categoryId) => {
    if (!categoryId) return;
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
        const errorData = await response.json();
        console.error("Backend error deleting category:", errorData);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${
            errorData.error || "Unknown error"
          }`
        );
      }

      fetchCategories(); // Refresh the list
      // Close confirmation modal
      setIsConfirmModalOpen(false);
      setActionToConfirm(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      alert(
        t("admin_category_management.delete_failed", { error: error.message })
      );
      // Close confirmation modal even on error
      setIsConfirmModalOpen(false);
      setActionToConfirm(null);
    }
  };

  // Functions to trigger confirmation modal
  const confirmAdd = (e) => {
    e.preventDefault(); // Prevent default form submission
    setConfirmMessage(t("admin_category_management.confirm_add"));
    setActionToConfirm(() => handleSubmit); // Store the add submit function
    setIsConfirmModalOpen(true);
  };

  const confirmEdit = (e) => {
    e.preventDefault(); // Prevent default form submission
    setConfirmMessage(t("admin_category_management.confirm_update"));
    setActionToConfirm(() => handleSubmit); // Store the edit submit function
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = (categoryId) => {
    setConfirmMessage(t("admin_category_management.confirm_delete"));
    setActionToConfirm(() => () => handleDeleteCategory(categoryId));
    setIsConfirmModalOpen(true);
  };

  // Function to handle confirmation action
  const handleConfirm = () => {
    if (actionToConfirm) {
      actionToConfirm(); // Execute the stored action (add, edit, or delete)
      // Modal closure is handled within the action functions now
    }
  };

  // Function to handle cancellation
  const handleCancelConfirm = () => {
    setIsConfirmModalOpen(false);
    setActionToConfirm(null); // Clear the stored action
  };

  // Derived state for hierarchical view
  const hierarchicalCategories = buildCategoryTree(categories);

  if (loading) {
    return <div className="p-6">{t("admin_category_management.loading")}</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        {t("admin_category_management.error", { error: error.message })}
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center bg-gradient-to-br from-green-50 to-white py-12 px-2">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-8 border border-green-100">
        <h2 className="text-3xl font-extrabold text-green-700 mb-8 text-center">
          {t("admin_category_management.title")}
        </h2>
        {/* Add Category Button */}
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowModal(true);
            setCategoryName("");
            setParentCategoryId("");
            setCategoryImage(null);
            setCategoryImageUrl("");
            setPreviewImageUrl("");
          }}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center text-sm mb-6"
        >
          {t("admin_category_management.add_category_button")}
        </button>

        {/* Modal for Add/Edit Category */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                onClick={() => setShowModal(false)}
                aria-label={t("admin_category_management.close_modal_aria")}
              >
                &times;
              </button>
              <form onSubmit={confirmAdd} className="flex flex-col gap-4">
                <h3 className="text-xl font-bold text-green-700 mb-2 text-center">
                  {editingCategory
                    ? t("admin_category_management.edit_category_title")
                    : t("admin_category_management.add_category_title")}
                </h3>
                <input
                  type="text"
                  placeholder={
                    editingCategory
                      ? t(
                          "admin_category_management.edit_category_name_placeholder"
                        )
                      : t(
                          "admin_category_management.new_category_name_placeholder"
                        )
                  }
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <select
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                  className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">
                    {t(
                      "admin_category_management.select_parent_category_option"
                    )}
                  </option>
                  {renderCategoryOptions(
                    hierarchicalCategories,
                    0,
                    editingCategory ? editingCategory.id : null,
                    t
                  )}
                </select>

                {/* Image upload field */}
                <div className="flex flex-col items-center gap-2 border border-dashed border-gray-300 p-4 rounded-md">
                  <label className="text-gray-700 font-medium text-sm">
                    {t("admin_category_management.category_image_label")}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="text-sm"
                    disabled={uploading}
                  />
                  {/* Preview and Remove Button */}
                  {(previewImageUrl || categoryImageUrl) && !uploading && (
                    <div className="flex flex-col items-center mt-2">
                      <img
                        src={previewImageUrl || { categoryImageUrl }}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded shadow border border-green-100 mb-2"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-red-600 text-sm hover:underline"
                      >
                        {t("admin_category_management.remove_image_button")}
                      </button>
                    </div>
                  )}
                  {uploading && (
                    <span className="text-xs text-gray-400">
                      {t("admin_category_management.uploading_status")}
                    </span>
                  )}
                </div>

                <div className="flex gap-4 mt-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center text-sm flex-1"
                    disabled={uploading || !categoryName.trim()}
                  >
                    {editingCategory
                      ? t("admin_category_management.update_category_button")
                      : t("admin_category_management.add_category_button")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition duration-200 shadow text-center text-sm flex-1"
                  >
                    {t("admin_category_management.cancel_button")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Category List (Hierarchical) */}
        <div className="bg-white p-4 rounded-2xl shadow border border-green-100">
          <h3 className="text-lg font-bold text-green-700 mb-4">
            {t("admin_category_management.categories_list_title")}
          </h3>
          {error && (
            <div className="text-red-500 mb-4">
              {t("admin_category_management.error", { error: error.message })}
            </div>
          )}
          {
            /* Render category tree */
            categories.length === 0 && !loading && !error ? (
              <p className="text-gray-500">
                {t("admin_category_management.no_categories_found")}
              </p>
            ) : (
              <ul className="space-y-1">
                {hierarchicalCategories.map((category) => (
                  <CategoryNode
                    key={category.id}
                    category={category}
                    onEdit={handleEditClick}
                    onDelete={confirmDelete} // Call confirmDelete instead of handleDeleteCategory directly
                    t={t} // Pass the t function down
                  />
                ))}
              </ul>
            )
          }
        </div>
      </div>
      {/* Confirmation Modal */}
      <ConfirmationModal
        message={confirmMessage}
        isOpen={isConfirmModalOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
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
