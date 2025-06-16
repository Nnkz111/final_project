import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCategories } from "../context/CategoryContext";
import { useTranslation } from "react-i18next";
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
          className="bg-white rounded-lg p-4 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow"
        >
          {" "}
          <div className="w-28 h-28 mb-3 flex items-center justify-center">
            {category.image_url ? (
              <img
                src={category.image_url}
                alt={category.name}
                className="w-full h-full object-contain rounded-lg"
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
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">{category.name}</h1>

      {children.length > 0 && <SubcategoryGrid categories={children} />}

      {children.length === 0 && !loading && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-2"
            >
              <div className="aspect-square mb-2">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
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
      )}

      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );

  // Removed loading check based on product fetching
  // if (loading) {
  //   return <div className="p-6">Loading category data...</div>;
  // }

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow">
      {/* Category Title matching CategoryListPage structure */}
      <h1 className="text-3xl mt-2 font-bold text-gray-800 border-b pb-4 mb-4 ">
        {t(`category_${category.name}`, category.name)}
      </h1>
      {/* Flex container for sidebar and main content */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Placeholder */}
        {isDisplayingProducts && (
          <aside className="hidden md:block w-64 h-fit">
            <div className="text-lg font-bold text-green-700 mb-4">
              {t("category_page_filters_title")}
            </div>
            {/* Sort by Price filter */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {t("category_page_sort_by_price_title")}
              </h3>
              <select
                value={sortByPrice}
                onChange={(e) => setSortByPrice(e.target.value)}
                className="w-full px-2 py-1 border rounded text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">{t("category_page_sort_none")}</option>
                <option value="lowToHigh">
                  {t("category_page_sort_low_to_high")}
                </option>
                <option value="highToLow">
                  {t("category_page_sort_high_to_low")}
                </option>
              </select>
            </div>
            {/* Other filters can be added here, also conditional if needed */}
          </aside>
        )}
        {/* Main content area - Ensure it grows to fill space */}
        <main className="flex-1 min-w-0 flex flex-col gap-8">
          {/* Display Subcategories if they exist, otherwise display the Category details and products */}
          {children.length > 0 ? (
            // Display Subcategories with Images in a Grid
            <section className="">
              {/* Ensure grid within main content spans available width */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 w-full">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    to={`/category/${child.id}`}
                    className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 border border-gray-200 text-center"
                  >
                    {child.image_url && (
                      <img
                        src={child.image_url}
                        alt={child.name}
                        className="w-full h-32 object-cover"
                      />
                    )}
                    <div className="p-3">
                      <div className="font-semibold text-base text-gray-800 mt-1">
                        {t(`category_${child.name}`, child.name)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            // Display Category details and products
            <>
              {/* Products Section */}
              <section className="">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-6">
                  {t("category_page_products_title")}
                </h2>
                {loading ? (
                  <div className="text-gray-500">
                    {t("category_page_loading_products")}
                  </div>
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                    {products.map((product) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.id}`}
                        className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 border border-gray-200 text-center"
                      >
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-40 object-cover"
                          />
                        )}
                        <div className="p-3">
                          <div className="font-semibold text-base text-gray-800 mt-1">
                            {product.name}
                          </div>
                          {/* Conditional display for price or out of stock */}
                          {product.stock_quantity > 0 ? (
                            <div className="text-sm text-green-600 mt-1">
                              {parseFloat(product.price).toLocaleString(
                                "lo-LA",
                                {
                                  style: "currency",
                                  currency: "LAK",
                                }
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-red-600 mt-1 font-bold">
                              {t("out_of_stock")}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">
                    {t("category_page_no_products")}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default CategoryPage;
