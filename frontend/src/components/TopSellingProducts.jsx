import React, { useEffect, useState } from "react";

function TopSellingProducts() {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          "http://localhost:5000/api/admin/top-selling-products"
        );
        if (!res.ok) throw new Error("Failed to fetch top selling products");
        const data = await res.json();
        setTopProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTopProducts();
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Top Selling Products
      </h3>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : topProducts.length === 0 ? (
        <div className="text-gray-500">No data available.</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {topProducts.map((product, idx) => (
            <li
              key={product.id}
              className="flex items-center justify-between py-3 px-2"
            >
              <span className="font-medium text-gray-800">
                {idx + 1}. {product.name}
              </span>
              <span className="text-gray-600 text-sm">
                {product.total_quantity} sold
              </span>
              <span className="text-green-700 font-semibold">
                $
                {parseFloat(product.total_sales).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TopSellingProducts;
