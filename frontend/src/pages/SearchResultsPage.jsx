import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

function SearchResultsPage() {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const searchTerm = new URLSearchParams(location.search).get("query");
  const [sortByPrice, setSortByPrice] = useState("");

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchTerm) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5000/api/products/search?query=${encodeURIComponent(
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
    return <div>Loading search results...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-gray-100 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Search Results for "{searchTerm}"
        </h2>
        <div className="flex items-center">
          <label htmlFor="sort-price" className="mr-2 text-gray-700">
            Sort by Price:
          </label>
          <select
            id="sort-price"
            className="border rounded-md p-2"
            value={sortByPrice}
            onChange={(e) => setSortByPrice(e.target.value)}
          >
            <option value="">Relevance</option>
            <option value="lowToHigh">Price: Low to High</option>
            <option value="highToLow">Price: High to Low</option>
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
                      src={`http://localhost:5000${product.image_url}`}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      No Image Available
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-red-600 font-bold text-lg">
                      ${parseFloat(product.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-lg mt-8">
          No products found matching your search term.
        </p>
      )}
    </div>
  );
}

export default SearchResultsPage;
