import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <div className="text-center">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">Error: {error.message}</div>
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
              {/* Product Image Area */}
              <div className="w-full h-48 overflow-hidden">
                {/* Use product.image_url when available */}
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

              {/* Product Details Area */}
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
                  {/* Add to Cart Button Placeholder */}
                  <button className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 text-sm">
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
