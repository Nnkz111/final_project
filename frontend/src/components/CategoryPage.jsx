import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCategories } from "../context/CategoryContext";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "./LoadingSpinner";
function getDescendantCategoryIds(categories, parentId) {
  return [parseInt(parentId)];
}

const SubcategoryGrid = ({ categories }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols- gap-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/category/${category.id}`}
          className="group bg-white rounded-lg p-4 flex flex-col items-center shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1"
        >
          <div className="w-28 h-28 mb-3 flex items-center justify-center overflow-hidden rounded-lg">
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="w-full h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No image</span>
              </div>
            )}
          </div>
          <h3 className="text-lg font-medium text-center">{category.name}</h3>
        </Link>
      ))}
    </div>
  );
};

function CategoryPage() {
  const params = useParams();
  const wildcardPath = params["*"] || "";
  const pathSegments = wildcardPath
    .split("/")
    .filter((segment) => segment !== "");
  const currentCategoryId = pathSegments[pathSegments.length - 1];
  const { t } = useTranslation();

  const { categories, hierarchicalCategories } = useCategories();
  const [category, setCategory] = useState(null);
  const [children, setChildren] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortByPrice, setSortByPrice] = useState(""); // State for sorting option: 'lowToHigh' or 'highToLow'

  // Helper to check if products are being displayed (category has no children)
  const isDisplayingProducts = children.length === 0;

  // Find the category and its children using the extracted currentCategoryId
  useEffect(() => {
    if (!categories.length || !currentCategoryId) {
      setLoading(false);
      return;
    }

    const cat = categories.find(
      (c) => String(c.id) === String(currentCategoryId)
    );
    setCategory(cat);

    const directChildren = categories.filter(
      (c) => String(c.parent_id) === String(currentCategoryId)
    );
    setChildren(directChildren);

    // Only fetch products if the current category has no direct children
    if (directChildren.length === 0 && cat) {
      setLoading(true);
      setProducts([]);
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      let apiUrl = `${API_URL}/api/products?category_id=${currentCategoryId}`;
      if (sortByPrice) {
        apiUrl += `&sort_by_price=${sortByPrice}`;
      }

      fetch(apiUrl)
        .then((res) => res.json())
        .then((data) => {
          // Assuming the API returns products directly or in a 'products' field
          setProducts(data.products || data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching products for category:", error);
          setLoading(false);
        });
    } else {
      // If the category has children, do not fetch products and stop loading
      setProducts([]);
      setLoading(false);
    }
  }, [currentCategoryId, categories, sortByPrice]); // Depend on currentCategoryId, categories, and sortByPrice

  // Helper to get category name by id
  const getCategoryName = (catId) => {
    if (!catId) return category?.name || "Unknown Category";
    const cat = categories.find((c) => String(c.id) === String(catId));
    return cat ? cat.name : category?.name || "Unknown Category";
  };

  // Removed groupedProducts logic
  // const groupedProducts = {};
  // products.forEach((product) => {
  //   const catId = product.category_id
  //     ? String(product.category_id)
  //     : String(category.id);
  //   if (!groupedProducts[catId]) groupedProducts[catId] = [];
  //   groupedProducts[catId].push(product);
  // });
  if (!category) {
    return (
      <div className="p-8 text-center text-gray-500">
        {t("category_page_not_found")}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 bg-white rounded-lg shadow">
      <h1 className="text-xl sm:text-2xl mt-4 font-bold border-b mb-6">
        {category.name}
      </h1>
      {children.length > 0 && <SubcategoryGrid categories={children} />}
      {children.length === 0 && !loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 p-2"
            >
              <div className="aspect-square mb-2 overflow-hidden rounded-lg">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <h3 className="text-md font-medium line-clamp-2">
                {product.name}
              </h3>
              <p className="text-lg font-bold text-green-600 mt-1">
                {new Intl.NumberFormat("lo-LA", {
                  style: "currency",
                  currency: "LAK",
                }).format(product.price)}
              </p>
            </Link>
          ))}
        </div>
      )}{" "}
      {loading && <LoadingSpinner />}
    </div>
  );
}

export default CategoryPage;
