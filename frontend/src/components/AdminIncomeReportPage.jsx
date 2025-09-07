import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import SalesAnalytic from "./SalesAnalytic";
import AdminAuthContext from "../context/AdminAuthContext";

// Helper: build a tree from flat category list
function buildCategoryTree(categories, parentId = null) {
  return categories
    .filter((cat) => cat.parent_id === parentId)
    .map((cat) => ({
      ...cat,
      children: buildCategoryTree(categories, cat.id),
    }));
}

// Helper: render options recursively
function renderCategoryOptions(tree, level = 0) {
  return tree.flatMap((cat) => [
    <option key={cat.id} value={cat.id}>
      {`${"\u00A0".repeat(level * 4)} ${cat.name}`}
    </option>,
    cat.children && cat.children.length > 0
      ? renderCategoryOptions(cat.children, level + 1)
      : null,
  ]);
}

function AdminIncomeReportPage() {
  const { t } = useTranslation();
  const { adminToken } = useContext(AdminAuthContext);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${API_URL}/api/categories`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data);
        setCategoryTree(buildCategoryTree(data));
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchCategories();
  }, []);

  // Helper for HTML escaping
  const escapeHtml = (unsafe) =>
    unsafe
      ? unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;")
      : "";

  const handleGenerate = async () => {
    if (!categoryId) return;
    setLoading(true);
    setError("");
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      // Add date range as query params if set
      let url = `${API_URL}/api/admin/income-report/category/${categoryId}`;
      const params = [];
      if (startDate) params.push(`start=${startDate}`);
      if (endDate) params.push(`end=${endDate}`);
      if (params.length) url += `?${params.join("&")}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch report");
      const data = await res.json();
      // Generate HTML for new window
      const now = new Date();
      // Format report date as DD-MM-YY
      const pad = (n) => n.toString().padStart(2, "0");
      const day = pad(now.getDate());
      const month = pad(now.getMonth() + 1);
      const year = now.getFullYear().toString();
      const reportDate = `${day}-${month}-${year}`;
      const reportTime = now.toLocaleTimeString("lo-LA", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const selectedCategory = categories.find(
        (c) => String(c.id) === String(categoryId)
      );
      let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>${escapeHtml(
            selectedCategory?.name || "Category Report"
          )}</title>
          <style>
            body { font-family: 'Noto Sans Lao', sans-serif; margin: 20px; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            h1 { color: #000; text-align: center; font-size: 2em; margin-bottom: 5px; }
            .meta { text-align: right; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f0f0f0; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .category_name {font-weight: bold; font-size: 1.5em; margin-top: 3px;}
            @media print { .print-hidden { display: none; } }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>ລາຍງານລາຍຮັບຕາມປະເພດສິນຄ້າ</h1>
            <div class="meta">
              <div>ວັນທີ: ${reportDate}</div>
              <div>ເວລາ: ${reportTime}</div>
              <div class="category_name">ປະເພດສິນຄ້າ: ${escapeHtml(
                selectedCategory?.name || "-"
              )}</div>
              <div>ຊ່ວງວັນທີ: <b>${startDate || "-"} - ${
        endDate || "-"
      }</b></div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ລຳດັບ</th>
                  <th>ລາຍລະອຽດ</th>
                  <th class="text-right">ມູນຄ່າ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>ລາຍຮັບລວມ</td>
                  <td class="text-right">${parseFloat(
                    data.total_income || 0
                  ).toLocaleString("lo-LA", {
                    style: "currency",
                    currency: "LAK",
                  })}</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>ຈຳນວນອໍເດີ</td>
                  <td class="text-right">${data.orders_count || 0}</td>
                </tr>
              </tbody>
            </table>
            <h2 style="margin-top:32px;">ລາຍການສິນຄ້າທີ່ຂາຍໄດ້</h2>
            <table>
              <thead>
                <tr>
                  <th>ລຳດັບ</th>
                  <th>ລະຫັດສິນຄ້າ</th>
                  <th>ຊື່ສິນຄ້າ</th>
                  <th class="text-right">ຈຳນວນທີ່ຂາຍໄດ້</th>
                  <th class="text-right">ລາຍຮັບສິນຄ້າ</th>
                </tr>
              </thead>
              <tbody>
                ${
                  Array.isArray(data.products) && data.products.length > 0
                    ? data.products
                        .map(
                          (prod, idx) => `
                    <tr>
                      <td>${idx + 1}</td>
                      <td>${escapeHtml(String(prod.product_id))}</td>
                      <td>${escapeHtml(prod.product_name)}</td>
                      <td class="text-right">${prod.total_quantity}</td>
                      <td class="text-right">${parseFloat(
                        prod.total_sales || 0
                      ).toLocaleString("lo-LA", {
                        style: "currency",
                        currency: "LAK",
                      })}</td>
                    </tr>
                  `
                        )
                        .join("")
                    : `<tr><td colspan="5" class="text-center">ບໍ່ມີການຂາຍສິນຄ້າໃນຊ່ວງນີ້</td></tr>`
                }
              </tbody>
            </table>
            <div class="print-hidden" style="text-align:center;margin-top:20px;">
              <button onclick="window.print()" style="background:#4CAF50;color:white;padding:10px 15px;border:none;border-radius:5px;cursor:pointer;">ພິມລາຍງານ</button>
            </div>
          </div>
        </body>
        </html>
      `;
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      } else {
        alert("Popup Blocked");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-green-700">
        ລາຍງານຂໍ້ມູນລາຍຮັບ
      </h1>
      <div className="flex gap-4 mb-4 items-end flex-wrap">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="border px-2 py-1 rounded min-w-[200px]"
        >
          <option value="" disabled>
            {t("category_income_report.select_category", "ເລຶອກປະເພດສິນຄ້າ")}
          </option>
          {renderCategoryOptions(categoryTree)}
        </select>
        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">
            {t("start_date", "Start Date")}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-600 mb-1">
            {t("end_date", "End Date")}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>
        <button
          onClick={handleGenerate}
          className="bg-green-600 text-white px-4 py-2 rounded"
          disabled={!categoryId || loading}
        >
          {loading
            ? t("category_income_report.generating", "ກຳລັງສ້າງ...")
            : t("category_income_report.generate_btn", "ສ້າງລາຍງານ")}
        </button>
        {error && <span className="text-red-500 ml-2">{error}</span>}
      </div>
      <SalesAnalytic />
    </div>
  );
}

export default AdminIncomeReportPage;
