import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "../components/LoadingSpinner";

function SearchResultsPage() {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const searchTerm = new URLSearchParams(location.search).get("search");
  const [sortByPrice, setSortByPrice] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchTerm) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(
          `${API_URL}/api/products/customer-search?search=${encodeURIComponent(
            searchTerm
          )}${sortByPrice ? `&sort_by_price=${sortByPrice}` : ""}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSearchResults(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError("Failed to load search results.");
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchTerm, sortByPrice]);
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div>{t("search_results_error", { message: error })}</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-gray-100 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("search_result")} {searchTerm}
        </h2>
        <div className="flex items-center">
          <label htmlFor="sort-price" className="mr-2 text-gray-700">
            {t("search_results_sort_by_price")}
          </label>
          <select
            id="sort-price"
            className="border rounded-md p-2"
            value={sortByPrice}
            onChange={(e) => setSortByPrice(e.target.value)}
          >
            <option value="">{t("search_results_sort_relevance")}</option>
            <option value="lowToHigh">
              {t("search_results_sort_low_to_high")}
            </option>
            <option value="highToLow">
              {t("search_results_sort_high_to_low")}
            </option>
          </select>
        </div>
      </div>
      {/* Search Results Grid */}
      {searchResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 pt-6 items-stretch">
          {searchResults.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transition-transform transform hover:scale-105 hover:shadow-xl cursor-pointer"
            >
              <a href={`/products/${product.id}`}>
                <div className="w-full h-48 overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      {t("search_results_no_image")}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-auto">
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
                </div>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-lg mt-8">
          {t("search_results_no_products")}
        </p>
      )}
    </div>
  );
}

export default SearchResultsPage;
