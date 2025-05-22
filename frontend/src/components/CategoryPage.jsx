import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCategories } from "../context/CategoryContext";

function getDescendantCategoryIds(categories, parentId) {
  const ids = [parseInt(parentId)];
  const stack = [parseInt(parentId)];
  while (stack.length) {
    const current = stack.pop();
    categories.forEach((cat) => {
      if (cat.parent_id === current) {
        ids.push(cat.id);
        stack.push(cat.id);
      }
    });
  }
  return ids;
}

function CategoryPage() {
  const { id } = useParams();
  const { categories, hierarchicalCategories } = useCategories();
  const [category, setCategory] = useState(null);
  const [children, setChildren] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Find the category, its children, and fetch products conditionally
  useEffect(() => {
    if (!categories.length) {
      setLoading(false);
      return;
    }

    const cat = categories.find((c) => String(c.id) === String(id));
    setCategory(cat);

    const directChildren = categories.filter(
      (c) => String(c.parent_id) === String(id)
    );
    setChildren(directChildren);

    // Only fetch products if the category has no direct children
    if (directChildren.length === 0) {
      setLoading(true);
      const allCategoryIds = getDescendantCategoryIds(categories, id);
      fetch(
        `http://localhost:5000/api/products?category_id=${allCategoryIds.join(
          ","
        )}`
      )
        .then((res) => res.json())
        .then((data) => {
          setProducts(data.products || data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      // If there are children, clear products and set loading to false
      setProducts([]);
      setLoading(false);
    }
  }, [id, categories]); // Depend on id and categories

  // Helper to get category name by id
  const getCategoryName = (catId) => {
    if (!catId) return category.name;
    const cat = categories.find((c) => String(c.id) === String(catId));
    return cat ? cat.name : category.name;
  };

  // Group products by their category_id
  const groupedProducts = {};
  products.forEach((product) => {
    const catId = product.category_id
      ? String(product.category_id)
      : String(category.id);
    if (!groupedProducts[catId]) groupedProducts[catId] = [];
    groupedProducts[catId].push(product);
  });

  if (!category) {
    return (
      <div className="p-8 text-center text-gray-500">Category not found.</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full bg-white rounded-none shadow-md border-b border-t border-green-100 py-8">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8">
          <aside className="hidden md:block w-64 h-fit">
            <div className="text-lg font-bold text-green-700 mb-4">Filters</div>
            <div className="text-gray-400">(Coming soon)</div>
          </aside>
          <main className="flex-1 flex flex-col gap-8">
            {children.length > 0 ? (
              <section className="">
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
              <>
                <h1 className="text-3xl font-bold text-green-700 mb-2">
                  {category.name}
                </h1>

                {category.image_url && (
                  <div className="w-full flex justify-center mb-4">
                    <img
                      src={`http://localhost:5000${category.image_url}`}
                      alt={`Image for ${category.name}`}
                      className="w-64 h-64 object-cover rounded-lg shadow-md border border-green-100"
                    />
                  </div>
                )}

                <section className="">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
                    <svg
                      className="w-6 h-6 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4"
                      />
                    </svg>
                    Products
                    <span className="text-sm text-gray-400 font-normal">
                      ({products.length} found)
                    </span>
                  </h2>
                  {loading ? (
                    <div className="text-gray-500">Loading products...</div>
                  ) : products.length === 0 ? (
                    <div className="text-gray-500">
                      No products found in this category.
                    </div>
                  ) : (
                    <div className="space-y-10">
                      {Object.keys(groupedProducts).map((catId) => (
                        <div key={catId}>
                          <h3 className="text-lg font-bold text-green-700 mb-4 border-l-4 border-green-400 pl-3 bg-green-50 py-1 rounded">
                            {getCategoryName(catId)}
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {groupedProducts[catId].map((product) => (
                              <div
                                key={product.id}
                                className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center border border-green-100 hover:shadow-xl transition duration-200 transform hover:-translate-y-1"
                              >
                                {product.image_url && (
                                  <img
                                    src={`http://localhost:5000${product.image_url}`}
                                    alt={product.name}
                                    className="w-32 h-32 object-cover rounded mb-2 shadow"
                                  />
                                )}
                                <div className="font-bold text-lg mb-1 text-gray-900 text-center">
                                  {product.name}
                                </div>
                                <div className="text-green-700 font-semibold mb-2 text-lg">
                                  ${parseFloat(product.price).toFixed(2)}
                                </div>
                                <Link
                                  to={`/products/${product.id}`}
                                  className="mt-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow"
                                >
                                  View Details
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default CategoryPage;
