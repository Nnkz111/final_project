import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
// We will no longer directly use useCart to modify cart state here,
// but might use it later to refresh cart data after adding.
// import { useCart } from '../context/CartContext';
import AuthContext from "../context/AuthContext"; // Import AuthContext
import { useCart } from "../context/CartContext"; // Import useCart hook
import { useCategories } from "../context/CategoryContext";

function ProductDetails() {
  const { id } = useParams(); // Get the product ID from the URL
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useContext(AuthContext); // Get user and token from AuthContext
  const { refreshCart } = useCart(); // Get refreshCart from CartContext
  const { hierarchicalCategories } = useCategories();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);

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
        setSelectedImage(
          data.images && data.images.length > 0
            ? data.images[0]
            : data.image_url
        );
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
    if (!user || !token) {
      // Prevent adding if not logged in
      alert("Please log in to add items to the cart."); // Optional: inform user
      return;
    }
    const productId = product.id;
    // Use the quantity state variable here
    try {
      const response = await fetch("http://localhost:5000/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Add Authorization header
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Optional: Provide user feedback (e.g., a small notification)
      console.log("Product added to cart!");
      // Optional: Refresh the cart data in the header/cart page after adding
      refreshCart(); // Refresh the cart data after adding
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

  // Helper: get all images (array)
  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.image_url
      ? [product.image_url]
      : [];

  // Helper: get discount info
  const hasDiscount = product.old_price && product.old_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.old_price - product.price) / product.old_price) * 100
      )
    : 0;

  // Helper: flatten categories for dropdown
  const flattenCategories = (cats) => {
    let arr = [];
    cats.forEach((cat) => {
      arr.push(cat);
      if (cat.children && cat.children.length > 0) {
        arr = arr.concat(flattenCategories(cat.children));
      }
    });
    return arr;
  };
  const allCategories = flattenCategories(hierarchicalCategories);

  return (
    <div className="w-full mx-auto mt-2 bg-white rounded-2xl shadow-xl p-4 md:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Image Gallery */}
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          {/* Thumbnails */}
          <div className="flex md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-x-visible">
            {images.map((img, idx) => (
              <button
                key={idx}
                className={`border rounded-md overflow-hidden w-16 h-16 md:w-20 md:h-20 flex-shrink-0 focus:outline-none ${
                  selectedImage === img ? "border-red-500" : "border-gray-200"
                }`}
                onClick={() => setSelectedImage(img)}
              >
                <img
                  src={`http://localhost:5000${img}`}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
          {/* Main Image */}
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            {selectedImage ? (
              <img
                src={`http://localhost:5000${selectedImage}`}
                alt={product.name}
                className="max-h-[400px] w-auto object-contain rounded-xl shadow-md"
              />
            ) : (
              <div className="w-full h-80 flex items-center justify-center text-gray-400 text-lg">
                No Image Available
              </div>
            )}
          </div>
        </div>
        {/* Product Info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
              {product.name}
            </h1>
            {/* Price/Discount Badge */}
            <div className="flex items-center gap-4 mb-2">
              <span className="text-2xl md:text-3xl font-bold text-red-500">
                {product.price.toLocaleString()} LAK
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {product.old_price.toLocaleString()} LAK
                  </span>
                  <span className="text-base text-white bg-red-500 rounded px-2 py-1 font-bold">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>
            {/* Description */}
            {product.description && (
              <p className="text-gray-700 text-base md:text-lg mb-6 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>
          {/* Quantity Selector & Add to Cart Button */}
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">Quantity</span>
              <div className="flex items-center border rounded-md overflow-hidden">
                <button
                  className="px-3 py-1 text-lg font-bold text-gray-600 hover:bg-gray-200"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  –
                </button>
                <input
                  type="number"
                  className="w-12 text-center border-0 focus:ring-0"
                  value={quantity}
                  min={1}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                />
                <button
                  className="px-3 py-1 text-lg font-bold text-gray-600 hover:bg-gray-200"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 mt-2">
              <button
                className="w-64 bg-black hover:opacity-80 text-white font-bold py-3 rounded-lg text-lg shadow transition"
                onClick={handleAddToCart}
                disabled={
                  typeof product.stock === "number" && product.stock <= 0
                }
              >
                ADD TO CART
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </div>
  );
}

export default ProductDetails;
