import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import AuthContext from "../context/AuthContext";
import { useTranslation } from "react-i18next";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { refreshCart } = useCart();
  const { user, token } = useContext(AuthContext);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${API_URL}/api/products`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProducts(data.products || []);
        setTotalProducts(
          data.total || (data.products ? data.products.length : 0)
        );
      } catch (error) {
        setError(error);
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // Empty dependency array means this effect runs once on mount

  // Function to handle adding a product to the persistent cart
  const handleAddToCart = async (product) => {
    if (!user || !token) {
      alert("Please log in to add items to the cart.");
      return;
    }
    const userId = user.id;
    const productId = product.id;
    const quantity = 1; // Adding one quantity at a time from this button

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, productId, quantity }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // After successfully adding to cart, refresh the header count
      refreshCart();

      console.log("Product added to cart!");
    } catch (error) {
      console.error("Error adding product to cart:", error);
      // Optional: Display an error message to the user
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-600 text-lg mt-8">
        {t("loading_products")}
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

  return (
    <main className="flex-1 px-3 py-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-8 text-gray-800 border-b pb-2">
        {t("featured_products_title")}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
        {products
          .slice(0, totalProducts > 10 ? 10 : totalProducts)
          .map((product) => (
            <Link key={product.id} to={`/products/${product.id}`}>
              <div className="bg-white rounded-lg md:rounded-xl shadow overflow-hidden transition-transform transform hover:scale-105 hover:shadow-lg cursor-pointer h-full flex flex-col">
                <div className="relative pb-[100%] w-full overflow-hidden bg-gray-50">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs md:text-sm">
                      {t("no_image_available")}
                    </div>
                  )}
                </div>

                <div className="p-2 md:p-4 flex flex-col flex-grow">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1 md:mb-2 line-clamp-2 min-h-[2.5em]">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between mt-auto">
                    {product.stock_quantity > 0 ? (
                      <p className="text-green-600 font-bold text-sm md:text-base">
                        {parseFloat(product.price).toLocaleString("lo-LA", {
                          style: "currency",
                          currency: "LAK",
                        })}
                      </p>
                    ) : (
                      <p className="text-red-600 font-bold text-sm md:text-base">
                        {t("out_of_stock")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
      </div>
      {totalProducts > 10 && (
        <div className="mt-8 text-center">
          <Link
            to="/products"
            className="bg-black hover:opacity-80 text-white font-bold py-2 px-4 rounded"
          >
            {t("show_all_products_button")}
          </Link>
        </div>
      )}
    </main>
  );
}

export default ProductList;
