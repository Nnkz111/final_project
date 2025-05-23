import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCategories } from "../context/CategoryContext";

function getDescendantCategoryIds(categories, parentId) {
  // This helper is now unused as we are not fetching products on this page
  return [parseInt(parentId)]; // Simplified return for clarity if still called elsewhere
}

function CategoryPage() {
  const params = useParams(); // Get all parameters
  const wildcardPath = params["*"] || ""; // Get the wildcard path string
  const pathSegments = wildcardPath
    .split("/")
    .filter((segment) => segment !== ""); // Split into segments and filter empty ones
  const currentCategoryId = pathSegments[pathSegments.length - 1]; // The last segment should be the current category ID

  const { categories, hierarchicalCategories } = useCategories();
  const [category, setCategory] = useState(null);
  const [children, setChildren] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Find the category and its children using the extracted currentCategoryId
  useEffect(() => {
    if (!categories.length) {
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

    // Removed product fetching logic
    // if (directChildren.length === 0) {
    //   setLoading(true);
    //   const allCategoryIds = getDescendantCategoryIds(categories, id);
    //   fetch(
    //     `http://localhost:5000/api/products?category_id=${allCategoryIds.join(
    //       ","
    //     )}`
    //   )
    //     .then((res) => res.json())
    //     .then((data) => {
    //       setProducts(data.products || data);
    //       setLoading(false);
    //     })
    //     .catch(() => setLoading(false));
    // } else {
    //   setProducts([]);
    setLoading(false);
    // }

    // New logic: if no direct children, fetch products for this category ID
    if (directChildren.length === 0 && cat) {
      setLoading(true);
      // Fetch products specifically for this category ID
      fetch(
        `http://localhost:5000/api/products?category_id=${currentCategoryId}`
      )
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
      setProducts([]); // Clear products if there are children categories
      setLoading(false);
    }
  }, [currentCategoryId, categories]); // Depend on currentCategoryId and categories

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
      <div className="p-8 text-center text-gray-500">Category not found.</div>
    );
  }

  // Removed loading check based on product fetching
  // if (loading) {
  //   return <div className="p-6">Loading category data...</div>;
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full-width white background container with top/bottom padding and borders */}
      <div className="w-full bg-white rounded-none shadow-md border-b border-t border-green-100 py-8">
        {/* Centered content container with max width, horizontal padding, and flex layout */}
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8">
          {/* Sidebar Placeholder */}
          <aside className="hidden md:block w-64 h-fit">
            <div className="text-lg font-bold text-green-700 mb-4">Filters</div>
            <div className="text-gray-400">(Coming soon)</div>
          </aside>
          {/* Main content area - Ensure it grows to fill space */}
          <main className="flex-1 flex flex-col gap-8">
            {/* Display Subcategories if they exist, otherwise display the Category details */}
            {children.length > 0 ? (
              // Display Subcategories with Images in a Grid
              <section className="">
                {/* Removed H2 based on user's accepted changes */}
                {/* Ensure grid within main content spans available width */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      to={`/category/${child.id}`}
                      className="block bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 border border-gray-200 text-center"
                    >
                      {child.image_url && (
                        <img
                          src={`http://localhost:5000${child.image_url}`}
                          alt={child.name}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <div className="p-3">
                        <div className="font-semibold text-base text-gray-800 mt-1">
                          {child.name}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : (
              // Display Category details (only if no direct children)
              <>
                {/* Category Title */}
                <h1 className="text-3xl font-bold text-green-700 mb-2">
                  {category.name}
                </h1>

                {/* Category Image */}
                {category.image_url && (
                  <div className="w-full flex justify-center mb-4">
                    <img
                      src={`http://localhost:5000${category.image_url}`}
                      alt={`Image for ${category.name}`}
                      className="w-64 h-64 object-cover rounded-lg shadow-md border border-green-100"
                    />
                  </div>
                )}

                {/* Removed Products Card section */}
                {/*
                <section className="">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
                     ... Products content ...
                  </h2>
                   ... loading/empty/product grid ...
                </section>
                */}

                {/* Optional: Message for leaf categories with no products shown */}
                <div className="text-gray-500">
                  No products are displayed on this page.
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default CategoryPage;
