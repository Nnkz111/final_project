import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  const { user, token } = useContext(AuthContext);
  const { refreshCart } = useCart();
  const { hierarchicalCategories } = useCategories();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${API_URL}/api/products/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const formattedProduct = {
          ...data,
          id: Number(data.id),
          price: Number(data.price),
          stock_quantity: Number(data.stock_quantity),
          old_price: data.old_price ? Number(data.old_price) : null,
        };
        setProduct(formattedProduct);
        setSelectedImage(
          formattedProduct.images && formattedProduct.images.length > 0
            ? formattedProduct.images[0]
            : formattedProduct.image_url
        );
      } catch (error) {
        setError(error);
        console.error(`Error fetching product ${id}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user || !token) {
      navigate("/login");
      return;
    }

    if (!product || !product.id) {
      console.error("Invalid product:", product);
      alert(t("error_invalid_product"));
      return;
    }

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
      console.error("Invalid quantity:", quantity, "Parsed:", parsedQuantity);
      alert(t("error_invalid_quantity"));
      return;
    }

    if (!user.id) {
      console.error("Missing user ID:", user);
      alert(t("error_invalid_user"));
      return;
    }

    const requestData = {
      productId: parseInt(product.id), // Changed from product_id to match backend
      quantity: parsedQuantity,
      // Removed user_id as it's handled by the backend via token
    };

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server response:", errorData);
        throw new Error(
          errorData.message ||
            errorData.error ||
            `HTTP error! status: ${response.status}`
        );
      }

      const responseData = await response.json();

      // Refresh the cart data after adding
      refreshCart();
    } catch (error) {
      console.error("Error adding product to cart:", error);
      alert(error.message || t("error_adding_to_cart"));
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
    </div>
  );
}

export default ProductDetails;
