import React, { useState, useEffect } from "react";
import axios from "axios";

function AdminProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the new product form
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    productImage: null,
  });
  const [isAdding, setIsAdding] = useState(false); // To show/hide the add form
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(false);

  // State for editing product
  const [editingProduct, setEditingProduct] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Function to fetch products
  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/products");
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(); // Fetch products on component mount
  }, []);

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
    setEditingProduct({ ...product, productImage: null }); // Set product to be edited, clear image for new upload
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
    // Only append image if a new one is selected
    if (editingProduct.productImage) {
      formData.append("productImage", editingProduct.productImage);
    } else if (editingProduct.image_url) {
      // If no new image but existing one is present, send the old URL
      // This is a simplified approach; a more robust solution might handle image updates differently
      formData.append("image_url", editingProduct.image_url);
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

  if (loading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Product Management
      </h2>

      {/* Add/Edit Product Button */}
      <button
        onClick={() => {
          // Toggle form visibility and clear editing state if closing
          if (isAdding && editingProduct) {
            handleCancelEdit();
          } else if (isAdding && !editingProduct) {
            setIsAdding(false);
          } else {
            setIsAdding(true);
          }
        }}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        {isAdding
          ? editingProduct
            ? "Cancel Edit"
            : "Cancel Add Product"
          : "Add New Product"}
      </button>

      {/* Add/Edit Product Form */}
      {isAdding && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
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
          <form onSubmit={handleSubmit}>
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

      {/* Product List */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Product List
        </h3>
        {products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Stock
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.stock_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {/* Edit and Remove buttons will go here */}
                    <button
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      onClick={() => handleEditClick(product)}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminProductManagement;
