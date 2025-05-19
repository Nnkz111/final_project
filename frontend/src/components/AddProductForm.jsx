import React, { useState } from "react";

function AddProductForm() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    productImage: null, // To store the selected file object
  });

  const [submitStatus, setSubmitStatus] = useState(""); // To show success or error messages

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, productImage: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitStatus("Uploading...");

    const data = new FormData(); // Use FormData for file uploads
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("stock_quantity", formData.stock_quantity);
    if (formData.productImage) {
      data.append("productImage", formData.productImage);
    }

    try {
      const response = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        // When using FormData, the 'Content-Type' header is automatically set
        // to 'multipart/form-data' with the correct boundary, so we don't set it here.
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const newProduct = await response.json();
      console.log("Product added successfully:", newProduct);
      setSubmitStatus("Product added successfully!");
      // Optionally clear the form or redirect
      setFormData({
        name: "",
        description: "",
        price: "",
        stock_quantity: "",
        productImage: null,
      });
      // Clear the file input manually if needed (requires a ref)
    } catch (error) {
      console.error("Error adding product:", error);
      setSubmitStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto mt-8 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Product Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          ></textarea>
        </div>
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700"
          >
            Price
          </label>
          <input
            type="number"
            name="price"
            id="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label
            htmlFor="stock_quantity"
            className="block text-sm font-medium text-gray-700"
          >
            Stock Quantity
          </label>
          <input
            type="number"
            name="stock_quantity"
            id="stock_quantity"
            value={formData.stock_quantity}
            onChange={handleChange}
            required
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label
            htmlFor="productImage"
            className="block text-sm font-medium text-gray-700"
          >
            Product Image
          </label>
          <input
            type="file"
            name="productImage"
            id="productImage"
            onChange={handleFileChange}
            accept="image/*"
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700"
          >
            Add Product
          </button>
        </div>
        {submitStatus && (
          <p
            className={`text-sm font-semibold ${
              submitStatus.startsWith("Error")
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {submitStatus}
          </p>
        )}
      </form>
    </div>
  );
}

export default AddProductForm;
