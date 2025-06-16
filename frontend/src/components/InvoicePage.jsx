import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
function InvoicePage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/api/orders/${orderId}`);
        if (!res.ok) throw new Error("Failed to fetch order details");
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error("Error fetching invoice details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t("loading_invoice_details")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">
          {t("error_fetching_invoice")}: {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t("invoice_not_found")}</div>
      </div>
    );
  }

  // Calculate subtotal from items (assuming price is per unit and quantity is available)
  const subtotal = order.items
    ? order.items.reduce(
        (sum, item) => sum + parseFloat(item.price) * item.quantity,
        0
      )
    : 0;

  // Function to handle printing the invoice
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="p-4 md:p-8 bg-white max-w-4xl mx-auto shadow-lg rounded-lg print:shadow-none print:rounded-none print:p-0">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800">
            {t("invoice_title")}
          </h1>
          <button
            onClick={handlePrint}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200 print:hidden"
          >
            {t("print_invoice_button")}
          </button>
        </div>

        {/* Company Info - Placeholder */}
        <div className="mb-8">
          <img
            src="https://res.cloudinary.com/dgfk0ljyq/image/upload/v1749228072/web_icon_t8i1f2.png"
            alt="Company Logo"
            className="h-16 mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-700">MR.IT</h2>
          <p className="text-gray-600 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mr-1"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
            </svg>
            {t("store_address")}
          </p>
          <p className="text-gray-600 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mr-1"
              viewBox="0 0 24 24"
            >
              <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.01.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.2c.28-.27.36-.66.24-1.01C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1C3 13.25 9.75 20 18 20c.55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
            </svg>
            020 59 450 123
          </p>
          <p className="text-gray-600 flex items-center ">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mr-1"
              viewBox="0 0 24 24"
            >
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            mrit.laos@gmail.com
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Invoice Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {t("invoice_details_title")}
            </h3>
            <p className="text-gray-700">
              <strong>{t("invoice_number_label")}:</strong> #{order.id}
            </p>
            <p className="text-gray-700">
              <strong>{t("invoice_date_label")}:</strong>{" "}
              {order.created_at &&
                new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Bill To / Ship To */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {t("bill_info")}
            </h3>
            <p className="text-gray-700">
              <strong>{t("customer_name_label")}:</strong> {order.shipping_name}
            </p>
            <p className="text-gray-700">
              <strong>{t("customer_email_label")}:</strong>{" "}
              {order.shipping_email}
            </p>
            <p className="text-gray-700">
              <strong>{t("customer_phone_label")}:</strong>{" "}
              {order.shipping_phone}
            </p>
            <p className="text-gray-700">
              <strong>{t("shipping_address_label")}:</strong>{" "}
              {order.shipping_address}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            {t("items_ordered_title")}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">
                    {t("table_header_item")}
                  </th>
                  <th className="py-3 px-6 text-center">
                    {t("table_header_qty")}
                  </th>
                  <th className="py-3 px-6 text-right">
                    {t("table_header_unit_price")}
                  </th>
                  <th className="py-3 px-6 text-right">
                    {t("table_header_total")}
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-700 text-sm font-light">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="py-3 px-6 text-left whitespace-nowrap">
                        {item.name}
                      </td>
                      <td className="py-3 px-6 text-center">{item.quantity}</td>
                      <td className="py-3 px-6 text-right">
                        {parseFloat(item.price).toLocaleString("lo-LA", {
                          style: "currency",
                          currency: "LAK",
                        })}
                      </td>
                      <td className="py-3 px-6 text-right font-semibold">
                        {(
                          parseFloat(item.price) * item.quantity
                        ).toLocaleString("lo-LA", {
                          style: "currency",
                          currency: "LAK",
                        })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="py-3 px-6 text-center text-gray-500"
                    >
                      {t("no_items_message")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end pr-6">
          <div className="w-full md:w-1/2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">{t("subtotal_label")}:</span>
              <span className="font-semibold text-gray-800">
                {subtotal.toLocaleString("lo-LA", {
                  style: "currency",
                  currency: "LAK",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p>{t("thank_you_message")}</p>
        </div>
      </div>
    </div>
  );
}

export default InvoicePage;
