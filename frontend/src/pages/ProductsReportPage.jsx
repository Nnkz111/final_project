import React, { useEffect, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import AdminAuthContext from "../context/AdminAuthContext"; // Change to AdminAuthContext

// Helper function to HTML-escape strings
const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

function ProductsReportPage() {
  const { t } = useTranslation();
  const { adminToken } = useContext(AdminAuthContext); // Use adminToken from AdminAuthContext
  const [loading, setLoading] = useState(false); // Changed to false, only loads on button click
  const [error, setError] = useState(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false); // New state for low stock filter

  const createProductsReport = async () => {
    setLoading(true);
    setError(null);
    try {
      // Add low_stock_only parameter if checkbox is checked
      const lowStockQuery = showLowStockOnly ? "&low_stock=true" : "";
      const res = await fetch(
        `http://localhost:5000/api/products?${lowStockQuery}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const products = data.products; // Assuming the API returns { products: [], total: X }

      // Get current date and time for the report
      const now = new Date();
      const reportDate = now.toLocaleDateString("lo-LA", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      const reportTime = now.toLocaleTimeString("lo-LA", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Generate the HTML content for the new report page
      let reportHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ລາຍງານຂໍ້ມູນສິນຄ້າ</title>
            <style>
                body { font-family: 'Noto Sans Lao', sans-serif; margin: 20px; color: #333; }
                button {font-family: 'Noto Sans Lao';}
                .container { max-width: 100%; margin: 0 auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                .header { text-align: left; margin-bottom: 30px; }
                .header img { height: 80px; margin-bottom: 10px; }
                 h1 { color: #000; text-align: center; font-size: 2em; margin-bottom: 5px; }
                .company-info { text-align: left; margin-bottom: 30px; }
                .company-info p { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
                .company-info svg { width: 16px; height: 16px; fill: currentColor; }
                .table-container { margin-top: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; /* Remove table-layout: fixed */ }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; white-space: nowrap; } /* Keep nowrap */
                th:nth-child(1) { width: 5%; }
                th:nth-child(2) { width: 10%; }
                th:nth-child(3) { width: 35%; }
                th:nth-child(4) { width: 20%; }
                th:nth-child(5) { width: 15%; text-align: right; } /* Adjust width and align */
                th:nth-child(6) { width: 15%; text-align: center; } /* Adjust width and align */
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                @media print {
                    .print-hidden { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://res.cloudinary.com/dgfk0ljyq/image/upload/v1749228072/web_icon_t8i1f2.png" alt="Store Logo">
                    <p style="text-align: right; margin-top: 10px;">ວັນທີ: ${reportDate}<br/>ເວລາ: ${reportTime}</p>
                </div>
                <div class="company-info">
                    <p><strong>ຮ້ານ MR.IT</strong></p>
                    <p>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/></svg>
                        ບ້ານ ວຽງໃໝ່, ນະຄອນຫຼວງພະບາງ, ແຂວງ ຫຼວງພະບາງ, ລາວ
                    </p>
                    <p>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.01.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.2c.28-.27.36-.66.24-1.01C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1C3 13.25 9.75 20 18 20c.55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/></svg>
                        020 59 450 123
                    </p>
                    <p>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                        mrit.laos@gmail.com
                    </p>
                </div>
                <h1 style="text-align: center;">ລາຍງານຂໍ້ມູນສິນຄ້າ</h1>
                <div class="report-actions print-hidden" style="text-align: center; margin-bottom: 20px;">
                    <button onclick="window.print()" style="background-color: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">ພິມລາຍງານ</button>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ລຳດັບ</th>
                                <th>ລະຫັດສິນຄ້າ</th>
                                <th>ຊື່</th>
                                <th>ປະເພດ</th>
                                <th class="text-right">ລາຄາ</th>
                                <th class="text-center">ຈຳນວນ</th>
                            </tr>
                        </thead>
                        <tbody>
      `;

      if (products.length === 0) {
        reportHtml += `<tr><td colspan="6" class="text-center">${
          t("no_products_found") || "No products found"
        }</td></tr>`;
      } else {
        products.forEach((product, index) => {
          reportHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${product.id}</td>
                <td>${escapeHtml(product.name)}</td>
                <td>${
                  product.category_name
                    ? escapeHtml(product.category_name)
                    : "N/A"
                }</td>
                <td class="text-right">${parseFloat(
                  product.price
                ).toLocaleString("lo-LA", {
                  style: "currency",
                  currency: "LAK",
                })}</td>
                <td class="text-center">${product.stock_quantity}</td>
            </tr>
          `;
        });
      }

      reportHtml += `
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
      `;

      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(reportHtml);
        newWindow.document.close();
      } else {
        alert("Popup Blocked");
      }
    } catch (err) {
      console.error("Error creating products report:", err);
      setError(t("error_creating_products_report") + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md flex flex-col items-center justify-center min-h-[70vh]">
      <h2 className="text-2xl font-semibold mb-6">ລາຍງານຂໍ້ມູນສິນຄ້າ</h2>

      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="lowStockFilter"
          checked={showLowStockOnly}
          onChange={(e) => setShowLowStockOnly(e.target.checked)}
          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="lowStockFilter" className="text-gray-700">
          ສິນຄ້າໃກ້ໝົດ
        </label>
      </div>

      <button
        onClick={createProductsReport}
        disabled={loading} // Disable button while loading
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow disabled:opacity-50"
      >
        {loading ? "ສ້າງລາຍງານ" : "ສ້າງລາຍງານ"}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}

export default ProductsReportPage;
