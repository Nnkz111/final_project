import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useCategories } from "../context/CategoryContext";
import ConfirmationModal from "./ConfirmationModal";
import { useTranslation } from "react-i18next";

function AdminProductManagement() {
  const { t } = useTranslation(); // Initialize translation hook

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // State for the new product form
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    productImage: null,
    category_id: "",
  });
  const [isAdding, setIsAdding] = useState(false); // To show/hide the add form
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(false);

  // State for editing product
  const [editingProduct, setEditingProduct] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // State for modal visibility
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [actionToConfirm, setActionToConfirm] = useState(null); // Store the action to perform on confirm

  const {
    categories,
    hierarchicalCategories,
    loading: categoriesLoading,
  } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  // Re-add triggerSearch state for button/Enter key press
  const [triggerSearch, setTriggerSearch] = useState(0);

  // Function to fetch products (with pagination, category filter, and search)
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const categoryQuery = selectedCategory
        ? `&category_id=${selectedCategory}`
        : "";
      const searchQuery = searchTerm ? `&search=${searchTerm}` : "";
      const response = await axios.get(
        `${API_URL}/api/products?limit=${pageSize}&offset=${
          (page - 1) * pageSize
        }${categoryQuery}${searchQuery}`
      );
      setProducts(response.data.products);
      setTotal(response.data.total);
      setLoading(false);
    } catch (err) {
      console.error(
        "Error fetching products for admin:",
        err.response?.data || err
      );
      setError(t("admin_product_management.fetch_error")); // Translate error message
      setLoading(false);
    }
  };

  // Fetch products when page, selected category, or triggerSearch changes
  useEffect(() => {
    // Reset page to 1 when category or search is triggered (not on every key stroke)
    if (page !== 1 && (selectedCategory !== "" || triggerSearch > 0)) {
      setPage(1);
    } else {
      fetchProducts(); // fetch uses current searchTerm internally
    }
    // No cleanup needed as we're not using setTimeout
  }, [page, selectedCategory, triggerSearch]); // Depend on triggerSearch, not searchTerm or live typing

  // Handle category filter change (still triggers fetch via selectedCategory dependency)
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    // No need to call fetchProducts here, useEffect will handle it via selectedCategory
  };

  // Re-add handleSearchKeyPress to trigger search on Enter key
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent default form submission
      setPage(1); // Reset page to 1 on new search
      setTriggerSearch((prev) => prev + 1); // Increment to trigger useEffect
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleFileChange = (e) => {
    setNewProduct({ ...newProduct, productImage: e.target.files[0] });
  };

  const handleAddSubmit = async () => {
    const formData = new FormData();
    formData.append("name", newProduct.name);
    formData.append("description", newProduct.description);
    formData.append("price", newProduct.price);
    formData.append("stock_quantity", newProduct.stock_quantity);
    if (newProduct.productImage) {
      formData.append("productImage", newProduct.productImage);
    }
    if (newProduct.category_id) {
      formData.append("category_id", newProduct.category_id);
    }

    try {
      // We need to send the authorization token with the request
      const token = localStorage.getItem("adminToken"); // Get admin token from local storage
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      await axios.post(`${API_URL}/api/products`, formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Important for file uploads
          Authorization: `Bearer ${token}`,
        },
      });
      setAddSuccess(true);
      setAddError(null);
      setNewProduct({
        // Clear the form
        name: "",
        description: "",
        price: "",
        stock_quantity: "",
        productImage: null,
        category_id: "",
      });
      setIsModalOpen(false); // Close the modal after successful add
      fetchProducts(); // Refresh the product list
      setIsConfirmModalOpen(false); // Close confirm modal after action
      setActionToConfirm(null); // Clear the stored action
    } catch (err) {
      console.error("Error adding product:", err.response?.data || err);
      setAddError(
        t("admin_product_management.add_error", {
          error: err.response?.data?.error || "",
        })
      ); // Translate error message
      setAddSuccess(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct({
      ...product,
      productImage: null,
      category_id: product.category_id || "",
    }); // Set product to be edited, clear image for new upload
    setIsModalOpen(true); // Open the modal for editing
    setAddSuccess(false); // Hide add success message
    setAddError(null); // Hide add error message
    setEditSuccess(false);
  };

  const handleEditSubmit = async () => {
    if (!editingProduct) return; // Should not happen if button is clicked correctly

    const formData = new FormData();
    formData.append("name", editingProduct.name);
    formData.append("description", editingProduct.description);
    formData.append("price", editingProduct.price);
    formData.append("stock_quantity", editingProduct.stock_quantity);
    if (editingProduct.productImage) {
      formData.append("productImage", editingProduct.productImage);
    } else if (editingProduct.image_url === null) {
      // If image was explicitly removed (both productImage and image_url are null)
      formData.append("image_url", ""); // Send empty string or a specific flag to backend to clear the image
    } else if (editingProduct.image_url) {
      // If no new image and existing image URL is present (image was not removed)
      formData.append("image_url", editingProduct.image_url); // Keep the existing image URL
    }
    if (editingProduct.category_id) {
      formData.append("category_id", editingProduct.category_id);
    }

    try {
      const token = localStorage.getItem("adminToken");
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      await axios.put(
        `${API_URL}/api/products/${editingProduct.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Still multipart even if no file for consistency
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setEditSuccess(true);
      setEditError(null);
      setEditingProduct(null); // Clear editing state
      setIsModalOpen(false); // Close the modal after successful edit
      fetchProducts(); // Refresh the list
      setIsConfirmModalOpen(false); // Close confirm modal after action
      setActionToConfirm(null); // Clear the stored action
    } catch (err) {
      console.error("Error updating product:", err.response?.data || err);
      setEditError(
        t("admin_product_management.update_error", {
          error: err.response?.data?.error || "",
        })
      ); // Translate error message
      setEditSuccess(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setIsModalOpen(false); // Close modal on cancel
    setAddError(null); // Clear any previous errors
    setEditError(null); // Clear any previous errors
  };

  // Functions to show the confirmation modal
  const confirmAdd = (e) => {
    e.preventDefault(); // Prevent default form submission
    setConfirmMessage(t("admin_product_management.confirm_add")); // Translate confirmation message
    setActionToConfirm(() => handleAddSubmit); // Store the add submit function
    setIsConfirmModalOpen(true);
  };

  const confirmEdit = (e) => {
    e.preventDefault(); // Prevent default form submission
    setConfirmMessage(t("admin_product_management.confirm_update")); // Translate confirmation message
    setActionToConfirm(() => handleEditSubmit); // Store the edit submit function
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = (id) => {
    setConfirmMessage(t("admin_product_management.confirm_delete")); // Translate confirmation message
    // Store a function that calls handleDeleteProduct with the specific ID
    setActionToConfirm(() => () => handleDeleteProduct(id));
    setIsConfirmModalOpen(true);
  };

  // Function to handle confirmation action
  const handleConfirm = () => {
    if (actionToConfirm) {
      actionToConfirm(); // Execute the stored action
      // Modal closure is handled within the action functions now
    }
  };

  // Function to handle cancellation
  const handleCancelConfirm = () => {
    setIsConfirmModalOpen(false);
    setActionToConfirm(null); // Clear the stored action
  };

  // Determine which form to display
  const formTitle = editingProduct
    ? t("admin_product_management.edit_product_title")
    : t("admin_product_management.add_product_title"); // Translate form title
  // Change handleSubmit to trigger confirmation modal
  const handleSubmit = editingProduct ? confirmEdit : confirmAdd;
  const currentProductData = editingProduct || newProduct;
  const handleInputChangeCurrent = editingProduct
    ? (e) =>
        setEditingProduct({
          ...editingProduct,
          [e.target.name]: e.target.value,
        })
    : handleInputChange;
  const handleFileChangeCurrent = editingProduct
    ? (e) =>
        setEditingProduct({
          ...editingProduct,
          productImage: e.target.files[0],
        })
    : handleFileChange;

  const handleDeleteProduct = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchProducts();
      // Close confirm modal after action
      setIsConfirmModalOpen(false);
      setActionToConfirm(null); // Clear the stored action
    } catch (err) {
      console.error("Error deleting product:", err.response?.data || err);
      alert(
        t("admin_product_management.delete_error", { error: err.message || "" })
      ); // Translate error message
      setIsConfirmModalOpen(false); // Close confirm modal even on error
      setActionToConfirm(null); // Clear the stored action even on error
    }
  };

  // Add function to handle removing product image
  const handleRemoveProductImage = () => {
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        productImage: null,
        image_url: null, // Also clear existing image URL
      });
    } else {
      setNewProduct({
        ...newProduct,
        productImage: null,
      });
    }
  };

  // Helper to get category name
  const getCategoryName = (catId) => {
    if (!catId || catId === "uncategorized")
      return t("admin_product_management.uncategorized"); // Translate uncategorized
    const cat = categories.find((c) => String(c.id) === String(catId));
    // If not found, treat as Uncategorized
    return cat ? cat.name : t("admin_product_management.uncategorized"); // Translate uncategorized
  };

  // Helper to render nested category options
  const renderCategoryOptions = (cats, level = 0) => {
    return cats.map((cat) => [
      <option key={cat.id} value={cat.id}>
        {`${"\u00A0".repeat(level * 4)}${t(`category_${cat.name}`, cat.name)}`}
      </option>,
      cat.children && cat.children.length > 0
        ? renderCategoryOptions(cat.children, level + 1)
        : null,
    ]);
  };

  // Pagination controls
  const totalPages = Math.ceil(total / pageSize);
  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  if (loading) {
    return <div>{t("admin_product_management.loading")}</div>; // Translate loading message
  }

  if (error) {
    return <div>{t("admin_product_management.error", { error: error })}</div>; // Translate error message
  }

  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center bg-gradient-to-br from-green-50 to-white py-12 px-2">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl p-8 border border-green-100">
        <h2 className="text-3xl font-extrabold text-green-700 mb-8 text-center">
          {t("admin_product_management.title")}
        </h2>
        {/* Add/Edit Product Button */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <button
            onClick={() => {
              // Always open modal for adding when button is clicked
              setIsModalOpen(true);
              setEditingProduct(null); // Ensure adding new product mode
              setNewProduct({
                // Clear new product form fields
                name: "",
                description: "",
                price: "",
                stock_quantity: "",
                productImage: null,
                category_id: "",
              });
              setAddError(null); // Clear errors
              setEditError(null); // Clear errors
              setAddSuccess(false); // Clear success messages
              setEditSuccess(false); // Clear success messages
            }}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center text-sm"
          >
            {t("admin_product_management.add_product_button")}
          </button>
        </div>
        {/* Add/Edit Product Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            {/* Main modal container with max height and flex column */}
            <div className="relative p-8 bg-white rounded-3xl shadow-2xl max-w-xl mx-auto w-full max-h-screen flex flex-col">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProduct(null); // Clear editing state when closing modal
                  setAddError(null); // Clear errors
                  setEditError(null); // Clear errors
                  // Also close confirmation modal and clear action if it was pending
                  setIsConfirmModalOpen(false);
                  setActionToConfirm(null);
                }}
              >
                &times;
              </button>
              {/* Modal content area - now flex-grow and scrollable */}
              <div className="bg-gray-50 p-6 rounded-2xl shadow mb-8 border border-green-100 flex-grow overflow-y-auto">
                <h3 className="text-xl font-bold text-green-700 mb-4 text-center">
                  {formTitle}
                </h3>
                {addError && (
                  <div className="text-red-500 mb-2">{addError}</div>
                )}
                {addSuccess && (
                  <div className="text-green-500 mb-2">
                    {t("admin_product_management.add_success")}
                  </div>
                )}
                {editError && (
                  <div className="text-red-500 mb-2">{editError}</div>
                )}
                {editSuccess && (
                  <div className="text-green-500 mb-2">
                    {t("admin_product_management.update_success")}
                  </div>
                )}
                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="md:col-span-1">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="name"
                    >
                      {t("admin_product_management.form_name_label")}
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={currentProductData.name || ""}
                      onChange={handleInputChangeCurrent}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="description"
                    >
                      {t("admin_product_management.form_description_label")}
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      value={currentProductData.description || ""}
                      onChange={handleInputChangeCurrent}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    ></textarea>
                  </div>
                  <div className="md:col-span-1">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="price"
                    >
                      {t("admin_product_management.form_price_label")}
                    </label>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      value={currentProductData.price || ""}
                      onChange={handleInputChangeCurrent}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="stock_quantity"
                    >
                      {t("admin_product_management.form_stock_label")}
                    </label>
                    <input
                      type="number"
                      name="stock_quantity"
                      id="stock_quantity"
                      value={currentProductData.stock_quantity || ""}
                      onChange={handleInputChangeCurrent}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="category_id"
                    >
                      {t("admin_product_management.form_category_label")}
                    </label>
                    <select
                      name="category_id"
                      id="category_id"
                      value={currentProductData.category_id || ""}
                      onChange={handleInputChangeCurrent}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value="">
                        {t("admin_product_management.uncategorized")}
                      </option>
                      {renderCategoryOptions(hierarchicalCategories)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label
                      className="block text-gray-700 text-sm font-bold mb-2"
                      htmlFor="productImage"
                    >
                      {t("admin_product_management.form_image_label")}
                    </label>
                    <input
                      type="file"
                      name="productImage"
                      id="productImage"
                      onChange={handleFileChangeCurrent}
                      accept="image/*"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                    {/* Display current image when editing or preview new image */}
                    {(currentProductData.image_url ||
                      currentProductData.productImage) && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          {t("admin_product_management.current_image")}:
                        </p>
                        <img
                          src={
                            currentProductData.productImage
                              ? URL.createObjectURL(
                                  currentProductData.productImage
                                )
                              : currentProductData.image_url
                          }
                          alt={currentProductData.name}
                          className="w-20 h-20 object-cover rounded-md mt-1"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveProductImage} // Add remove button handler
                          className="text-red-600 text-sm hover:underline mt-1"
                        >
                          {t("remove_image_button")}{" "}
                          {/* Translate button text */}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between md:col-span-2">
                    <button
                      type="submit"
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                      {editingProduct
                        ? t("admin_product_management.update_product_button")
                        : t("admin_product_management.add_product_button")}
                    </button>
                    {editingProduct && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                      >
                        {t("admin_product_management.cancel_button")}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* Search Input and Category Filter */}
        <div className="mb-6 flex flex-col md:flex-row items-center gap-2">
          <input
            type="text"
            placeholder={t("admin_product_management.search_placeholder")} // Translate placeholder
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} // Only update searchTerm on change
            onKeyPress={handleSearchKeyPress} // Add back key press handler
            className="border px-3 py-2 rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-md"
          />
          {/* Add Search Button */}
          <button
            onClick={() => {
              setPage(1); // Reset page to 1 on new search
              setTriggerSearch((prev) => prev + 1); // Trigger fetch
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 transition duration-200 shadow text-sm"
          >
            {t("admin_product_management.search_button")}{" "}
            {/* Translate button text */}
          </button>
          {/* Category Filter Dropdown */}
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">
              {t("admin_product_management.all_categories")}
            </option>
            {renderCategoryOptions(hierarchicalCategories)}
          </select>
        </div>
        {/* Product List */}
        <div className="bg-white p-4 rounded-2xl shadow border border-green-100">
          <h3 className="text-lg font-bold text-green-700 mb-4">
            {t("admin_product_management.product_list_title")}
          </h3>
          {products.length === 0 ? (
            <p className="text-gray-500 text-center">
              {t("admin_product_management.no_products_found")}
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-auto">
                    ລຳດັບ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-1/3">
                    {t("admin_product_management.table_header_name")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-1/6">
                    {t("admin_product_management.table_header_price")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-1/6">
                    {t("admin_product_management.table_header_stock")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-1/6">
                    {t("admin_product_management.table_header_image")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-1/3">
                    {t("admin_product_management.table_header_actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product, index) => (
                  <tr key={product.id} className="hover:bg-green-50 transition">
                    <td className="px-4 py-3 align-middle">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-3 align-middle">{product.name}</td>
                    <td className="px-4 py-3 align-middle">{product.price}</td>
                    <td className="px-4 py-3 align-middle">
                      {product.stock_quantity}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 flex items-center justify-center text-gray-500 text-xs rounded">
                          {t("admin_product_management.no_image")}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow text-sm mr-2"
                      >
                        {t("admin_product_management.edit_button")}
                      </button>
                      <button
                        onClick={() => confirmDelete(product.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-red-700 transition duration-200 shadow text-sm"
                      >
                        {t("admin_product_management.delete_button")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={handlePrev}
              disabled={page === 1 || loading}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="font-semibold text-green-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={page === totalPages || loading}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
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

export default AdminProductManagement;
