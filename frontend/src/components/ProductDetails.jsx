import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
// We will no longer directly use useCart to modify cart state here,
// but might use it later to refresh cart data after adding.
// import { useCart } from '../context/CartContext';
import AuthContext from "../context/AuthContext"; // Import AuthContext
import { useCart } from "../context/CartContext"; // Import useCart hook
import { useCategories } from "../context/CategoryContext";
import { useTranslation } from "react-i18next";

function ProductDetails() {
  const { id } = useParams(); // Get the product ID from the URL
  const navigate = useNavigate(); // Get the navigate function
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useContext(AuthContext); // Get user and token from AuthContext
  const { refreshCart } = useCart(); // Get refreshCart from CartContext
  const { hierarchicalCategories } = useCategories();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const { t } = useTranslation();

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
      // Redirect to login page if not logged in
      navigate("/login");
      return;
    }

    // Check if product is out of stock before adding
    if (product && product.stock_quantity <= 0) {
      alert("Product is out of stock.");
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
        {t("product_details_loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 text-lg mt-8">
        {t("error_message", { message: error.message })}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center text-gray-600 text-lg mt-8">
        {t("product_not_found")}
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
                  src={img}
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
                src={selectedImage}
                alt={product.name}
                className="max-h-[400px] w-auto object-contain rounded-xl shadow-md"
              />
            ) : (
              <div className="w-full h-80 flex items-center justify-center text-gray-400 text-lg">
                {t("no_image_available")}
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
              {/* Always display price */}
              <span className="text-2xl md:text-3xl font-bold text-green-600">
                {parseFloat(product.price).toLocaleString("lo-LA", {
                  style: "currency",
                  currency: "LAK",
                })}
              </span>

              {hasDiscount && (
                <>
                  <span className="text-lg text-red-500 line-through">
                    {product.old_price.toLocaleString("lo-LA", {
                      style: "currency",
                      currency: "LAK",
                    })}
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

            {/* Display Stock Quantity */}
            <div className="mb-4 text-gray-700 text-base md:text-lg">
              {product.stock_quantity > 0 ? (
                <span>
                  {t("stock_label")}: {product.stock_quantity}
                </span>
              ) : (
                <span className="text-red-600 font-bold">
                  {t("out_of_stock")}
                </span>
              )}
            </div>
          </div>
          {/* Quantity Selector & Add to Cart Button */}
          <div className="mt-6 flex flex-col gap-4">
            {/* Conditionally render quantity selector and add to cart button */}
            {product.stock_quantity > 0 ? (
              <>
                <div className="flex items-center gap-4">
                  <span className="font-medium">{t("quantity_label")}</span>
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
                      disabled={quantity >= product.stock_quantity}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 mt-2">
                  <button
                    className="w-64 bg-black hover:opacity-80 text-white font-bold py-3 rounded-lg text-lg shadow transition"
                    onClick={handleAddToCart}
                  >
                    {t("product_details_add_to_cart_button")}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-red-600 font-bold text-lg">
                {t("out_of_stock")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products Section (Optional) */}
      {/* <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          // Example related product cards
          // <ProductCard product={...} />
        </div>
      </div> */}
    </div>
  );
}

export default ProductDetails;
