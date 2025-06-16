import React from "react";
import { Link } from "react-router-dom";
import { useCategories } from "../context/CategoryContext";
import { useTranslation } from "react-i18next";

const CategoryListPage = () => {
  const { categories, loading, error } = useCategories();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        {t("category_list_loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        {t("category_list_error")}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        {t("category_list_no_categories")}
      </div>
    );
  }

  // Filter for top-level categories (parent_id is null or 0, depending on your data)
  const topLevelCategories = categories.filter(
    (cat) => !cat.parent_id || cat.parent_id === 0
  );

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow flex flex-col">
      <h1 className="text-3xl mt-4 font-bold text-gray-800 border-b pb-4">
        {t("category_list_title")}
      </h1>
      {/* Using Grid for 3 columns per row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4 items-stretch">
        {topLevelCategories.map((category) => (
          <Link
            key={category.id}
            to={`/category/${category.id}`}
            className="block border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1"
          >
            <div className="w-full h-40 overflow-hidden">
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                // Placeholder for categories without images
                <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500">
                  {t("category_list_no_image")}
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 text-center">
              <h2 className="font-semibold text-lg text-gray-700">
                {t(`category_${category.name}`, category.name)}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryListPage;
