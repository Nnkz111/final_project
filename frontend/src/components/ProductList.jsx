import React, { useEffect, useState } from "react";

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
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <main className="flex-1 p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Featured Products
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-md overflow-hidden transition-transform transform hover:scale-105"
          >
            {/* Placeholder for product image - you'll add this later */}
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
              No Image
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {product.name}
              </h3>
              {/* <p className="text-gray-600 text-sm mb-2">{product.description}</p> Uncomment when you have descriptions */}
              <p className="text-green-600 font-bold text-xl">
                ${product.price}
              </p>
              {/* Add 'Add to Cart' button or other actions here */}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default ProductList;
