import React, { useState, useEffect } from "react";
import axios from "axios";
import { useCategories } from "../context/CategoryContext";

function AdminProductManagement() {
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

  const {
    categories,
    hierarchicalCategories,
    loading: categoriesLoading,
  } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");

  // Function to fetch products (with pagination)
  const fetchProducts = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/products?limit=${pageSize}&offset=${
          (pageNum - 1) * pageSize
        }`
      );
      setProducts(response.data.products);
      setTotal(response.data.total);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(page);
  }, [page]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleFileChange = (e) => {
    setNewProduct({ ...newProduct, productImage: e.target.files[0] });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

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
      await axios.post("http://localhost:5000/api/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Important for file uploads
          Authorization: `Bearer ${token}`, // Include the token
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
      setIsAdding(false); // Hide the form after successful add
      fetchProducts(); // Refresh the product list
    } catch (err) {
      console.error("Error adding product:", err.response?.data || err);
      setAddError(err.response?.data?.error || "Failed to add product.");
      setAddSuccess(false);
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct({
      ...product,
      productImage: null,
      category_id: product.category_id || "",
    }); // Set product to be edited, clear image for new upload
    setIsAdding(true); // Show the form
    setAddSuccess(false); // Hide add success message
    setAddError(null); // Hide add error message
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editingProduct) return; // Should not happen if button is clicked correctly

    const formData = new FormData();
    formData.append("name", editingProduct.name);
    formData.append("description", editingProduct.description);
    formData.append("price", editingProduct.price);
    formData.append("stock_quantity", editingProduct.stock_quantity);
    if (editingProduct.productImage) {
      formData.append("productImage", editingProduct.productImage);
    } else if (editingProduct.image_url) {
      formData.append("image_url", editingProduct.image_url);
    }
    if (editingProduct.category_id) {
      formData.append("category_id", editingProduct.category_id);
    }

    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `http://localhost:5000/api/products/${editingProduct.id}`,
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
      setIsAdding(false); // Hide the form
      fetchProducts(); // Refresh the list
    } catch (err) {
      console.error("Error updating product:", err.response?.data || err);
      setEditError(err.response?.data?.error || "Failed to update product.");
      setEditSuccess(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setIsAdding(false);
    setAddError(null); // Clear any previous errors
    setEditError(null); // Clear any previous errors
  };

  // Determine which form to display
  const formTitle = editingProduct ? "Edit Product" : "Add New Product";
  const handleSubmit = editingProduct ? handleEditSubmit : handleAddSubmit;
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
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err.response?.data || err);
      setError("Failed to delete product.");
    }
  };

  // Filter products by search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group products by category_id
  const groupedProducts = {};
  filteredProducts.forEach((product) => {
    const catId = product.category_id
      ? String(product.category_id)
      : "uncategorized";
    if (!groupedProducts[catId]) groupedProducts[catId] = [];
    groupedProducts[catId].push(product);
  });

  // Helper to get category name
  const getCategoryName = (catId) => {
    if (!catId || catId === "uncategorized") return "Uncategorized";
    const cat = categories.find((c) => String(c.id) === String(catId));
    // If not found, treat as Uncategorized
    return cat ? cat.name : "Uncategorized";
  };

  // Helper to render nested category options
  const renderCategoryOptions = (cats, level = 0) => {
    return cats.map((cat) => [
      <option key={cat.id} value={cat.id}>
        {`${"\u00A0".repeat(level * 4)}${cat.name}`}
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
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center bg-gradient-to-br from-green-50 to-white py-12 px-2">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl p-8 border border-green-100">
        <h2 className="text-3xl font-extrabold text-green-700 mb-8 text-center">
          Product Management
        </h2>
        {/* Add/Edit Product Button */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <button
            onClick={() => {
              if (isAdding && editingProduct) {
                handleCancelEdit();
              } else if (isAdding && !editingProduct) {
                setIsAdding(false);
              } else {
                setIsAdding(true);
              }
            }}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center text-sm"
          >
            {isAdding
              ? editingProduct
                ? "Cancel Edit"
                : "Cancel Add Product"
              : "Add New Product"}
          </button>
        </div>
        {/* Add/Edit Product Form */}
        {isAdding && (
          <div className="bg-gray-50 p-6 rounded-2xl shadow mb-8 border border-green-100">
            <h3 className="text-xl font-bold text-green-700 mb-4 text-center">
              {formTitle}
            </h3>
            {addError && <div className="text-red-500 mb-2">{addError}</div>}
            {addSuccess && (
              <div className="text-green-500 mb-2">
                Product added successfully!
              </div>
            )}
            {editError && <div className="text-red-500 mb-2">{editError}</div>}
            {editSuccess && (
              <div className="text-green-500 mb-2">
                Product updated successfully!
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="name"
                >
                  Name
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
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  value={currentProductData.description || ""}
                  onChange={handleInputChangeCurrent}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                ></textarea>
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="price"
                >
                  Price
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
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="stock_quantity"
                >
                  Stock Quantity
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
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="category_id"
                >
                  Category
                </label>
                <select
                  name="category_id"
                  id="category_id"
                  value={currentProductData.category_id || ""}
                  onChange={handleInputChangeCurrent}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">Uncategorized</option>
                  {renderCategoryOptions(hierarchicalCategories)}
                </select>
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="productImage"
                >
                  Product Image
                </label>
                <input
                  type="file"
                  name="productImage"
                  id="productImage"
                  onChange={handleFileChangeCurrent}
                  accept="image/*"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                {/* Display current image when editing */}
                {editingProduct?.image_url &&
                  !currentProductData.productImage && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Current Image:</p>
                      <img
                        src={`http://localhost:5000${editingProduct.image_url}`}
                        alt="Current Product"
                        className="w-20 h-20 object-cover rounded-md mt-1"
                      />
                    </div>
                  )}
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {editingProduct ? "Update Product" : "Add Product"}
                </button>
                {editingProduct && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
        {/* Search Input */}
        <div className="mb-6 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-3 py-2 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        {/* Product List */}
        <div className="bg-white p-4 rounded-2xl shadow border border-green-100">
          <h3 className="text-lg font-bold text-green-700 mb-4">
            Product List
          </h3>
          {Object.keys(groupedProducts).length === 0 ? (
            <p className="text-gray-500 text-center">No products found.</p>
          ) : (
            Object.keys(groupedProducts).map((catId) => (
              <div key={catId} className="mb-8">
                <h4 className="text-md font-bold text-green-700 mb-2">
                  {getCategoryName(catId)}
                </h4>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-1/3">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-1/6">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-1/6">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-1/3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupedProducts[catId].map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-green-50 transition"
                      >
                        <td className="px-4 py-3 align-middle">
                          {product.name}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {product.price}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {product.stock_quantity}
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow text-sm mr-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-red-700 transition duration-200 shadow text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={handlePrev}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="font-semibold text-green-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={page === totalPages}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminProductManagement;
