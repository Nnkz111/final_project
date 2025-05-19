import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import AuthContext from "../context/AuthContext";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { refreshCartCount } = useCart();
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
        setProducts(data);
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
      refreshCartCount();

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
    <main className="flex-1 p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Featured Products
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link key={product.id} to={`/products/${product.id}`}>
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105 cursor-pointer">
              <div className="w-full h-48 overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                    No Image Available
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-green-600 font-bold text-xl">
                    ${product.price}
                  </p>
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

export default ProductList;
