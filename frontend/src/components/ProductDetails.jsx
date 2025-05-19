import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
// We will no longer directly use useCart to modify cart state here,
// but might use it later to refresh cart data after adding.
// import { useCart } from '../context/CartContext';

function ProductDetails() {
  const { id } = useParams(); // Get the product ID from the URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const { addToCart } = useCart(); // Not directly used for state modification anymore

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Fetch product details from the backend using the ID
        // We will create this backend endpoint next
        const response = await fetch(
          `http://localhost:5000/api/products/${id}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        setError(error);
        console.error(`Error fetching product ${id}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]); // Re-run effect if the ID changes

  // Function to handle adding a product to the persistent cart
  const handleAddToCart = async () => {
    const userId = 1; // *** Replace with actual user ID from authentication later ***
    const productId = product.id;
    const quantity = 1; // Adding one quantity at a time from this button

    try {
      const response = await fetch("http://localhost:5000/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, productId, quantity }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Optional: Provide user feedback (e.g., a small notification)
      console.log("Product added to cart!");
      // Optional: Refresh the cart data in the header/cart page after adding
      // You might trigger a context update or refetch here later.
    } catch (error) {
      console.error("Error adding product to cart:", error);
      // Optional: Display an error message to the user
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-600 text-lg mt-8">
        Loading product details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 text-lg mt-8">
        Error: {error.message}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center text-gray-600 text-lg mt-8">
        Product not found.
      </div>
    );
  }

  // Display product details with enhanced styling
  return (
    <div className="container mx-auto mt-8 p-6 bg-white rounded-lg shadow-xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Product Image Area */}
        <div className="w-full md:w-1/2 lg:w-1/3 overflow-hidden rounded-lg shadow-md">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-64 md:h-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg">
              No Image Available
            </div>
          )}
        </div>

        {/* Product Details Content */}
        <div className="w-full md:w-1/2 lg:w-2/3">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {product.name}
          </h2>
          {product.description && (
            <p className="text-gray-700 text-base mb-4 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
            <p className="text-green-700 font-bold text-2xl">
              ${product.price}
            </p>
            {/* Add to Cart Button */}
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-300"
              onClick={handleAddToCart}
            >
              Add to Cart
            </button>
          </div>
          {/* Add more details like stock, etc. here */}
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
