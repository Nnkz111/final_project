import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function TopSellingProducts() {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { t } = useTranslation();

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${API_URL}/api/admin/top-selling-products`);
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
        {t("topSellingProducts.title")}
      </h3>
      {loading ? (
        <div className="text-gray-500">{t("topSellingProducts.loading")}</div>
      ) : error ? (
        <div className="text-red-500">
          {t("topSellingProducts.error", { error: error })}
        </div>
      ) : topProducts.length === 0 ? (
        <div className="text-gray-500">{t("topSellingProducts.noData")}</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {topProducts.map((product, idx) => (
            <li
              key={product.name}
              className="flex items-center justify-between py-3 px-2"
            >
              <span className="font-medium text-gray-800">
                {idx + 1}. {product.name}
              </span>
              <span className="text-gray-600 text-sm">
                {product.total_quantity} {t("topSellingProducts.sold")}
              </span>
              <span className="text-green-700 font-semibold">
                {parseFloat(product.total_sales).toLocaleString("lo-LA", {
                  style: "currency",
                  currency: "LAK",
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
