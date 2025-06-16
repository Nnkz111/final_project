import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8);
  const { t } = useTranslation();

  // State for price sorting
  const [sortOrder, setSortOrder] = useState("none"); // 'none', 'asc', 'desc'

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
        setProducts(data.products || []); // Ensure products is always an array
      } catch (error) {
        setError(error);
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // Empty dependency array means this effect runs once on mount

  const totalPages = Math.ceil(products.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Sort products based on sortOrder
  const sortedProducts = [...products].sort((a, b) => {
    const priceA = parseFloat(a.price);
    const priceB = parseFloat(b.price);
    if (sortOrder === "asc") {
      return priceA - priceB;
    } else if (sortOrder === "desc") {
      return priceB - priceA;
    }
    return 0; // No sorting
  });

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading products...</div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading products.
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">No products found.</div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow flex flex-col">
      <h1 className="text-3xl mt-4 font-bold text-gray-800 border-b pb-4">
        {t("all_products")}
      </h1>

      {/* Price Sorting Control */}
      <div className="flex items-center gap-4 mb-6">
        <label
          htmlFor="sortOrder"
          className="block text-sm font-medium text-gray-700"
        >
          {t("sort_by_price_title")}
        </label>
        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
        >
          <option value="none">{t("sort_none")}</option>
          <option value="asc">{t("sort_low_to_high")}</option>
          <option value="desc">{t("sort_high_to_low")}</option>
        </select>
      </div>

      {/* Using Grid for responsive columns */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 pt-6">
        {/* Use items-stretch to make cards same height */}
        {currentProducts.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="block border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1"
          >
            <div className="w-full h-40 overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  {t("no_image_available")}
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col">
              <h2 className="font-semibold text-lg text-gray-700 mb-2">
                {product.name}
              </h2>
              {/* You can add more product details here if needed */}
              {/* Conditional display for price or out of stock */}
              {product.stock_quantity > 0 ? (
                <p className="text-green-600 font-bold mt-auto">
                  {parseFloat(product.price).toLocaleString("lo-LA", {
                    style: "currency",
                    currency: "LAK",
                  })}
                </p>
              ) : (
                <p className="text-red-600 font-bold mt-auto">
                  {t("out_of_stock")}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination Controls */}
      {products.length > productsPerPage && totalPages > 1 && (
        <div className="mt-8 w-full text-center">
          <nav>
            <ul className="inline-flex items-center -space-x-px">
              {/* Previous Button */}
              <li>
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
              </li>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <li key={number}>
                    <button
                      onClick={() => paginate(number)}
                      className={`px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                        currentPage === number
                          ? "bg-blue-500 text-white hover:bg-blue-500 hover:text-white"
                          : ""
                      }`}
                    >
                      {number}
                    </button>
                  </li>
                )
              )}

              {/* Next Button */}
              <li>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ProductListPage;
