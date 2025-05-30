// This is a test comment to trigger a refresh
import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import AuthContext from "../context/AuthContext";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { refreshCart } = useCart();
  const { user, token } = useContext(AuthContext);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Replace with your backend API URL if it's different
        const response = await fetch("http://localhost:5000/api/products");
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
      const response = await fetch("http://localhost:5000/api/cart/add", {
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
        Loading products...
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

  return (
    <main className="flex-1 p-6">
      <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-2">
        Featured Products
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {products
          .slice(0, totalProducts > 10 ? 10 : totalProducts)
          .map((product) => (
            <Link key={product.id} to={`/products/${product.id}`}>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-105 hover:shadow-xl cursor-pointer h-full flex flex-col">
                <div className="w-full h-48 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={`http://localhost:5000${product.image_url}`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      No Image Available
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 truncate">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-red-600 font-bold text-lg">
                      ${parseFloat(product.price).toFixed(2)}
                    </p>
                    {/* Removed Add to Cart button to match image design */}
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
            Show All Products
          </Link>
        </div>
      )}
    </main>
  );
}

export default ProductList;
