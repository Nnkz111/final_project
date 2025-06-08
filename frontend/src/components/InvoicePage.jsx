import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
        const res = await fetch(`http://localhost:5000/api/orders/${orderId}`);
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
      <div className="min-h-[70vh] w-full flex items-center justify-center">
        {t("loading_invoice_details")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center text-red-500">
        {t("error_fetching_invoice")}: {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center text-gray-500">
        {t("invoice_not_found")}
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
    <div className="p-4 md:p-8 bg-white max-w-4xl mx-auto my-8 shadow-lg rounded-lg">
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
        <p className="text-gray-600">{t("store_address")}</p>
        <p className="text-gray-600">020 59 450 123</p>
        <p className="text-gray-600">mrit.laos@gmail.com</p>
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
            <strong>{t("customer_email_label")}:</strong> {order.shipping_email}
          </p>
          <p className="text-gray-700">
            <strong>{t("customer_phone_label")}:</strong> {order.shipping_phone}
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
                      {(parseFloat(item.price) * item.quantity).toLocaleString(
                        "lo-LA",
                        {
                          style: "currency",
                          currency: "LAK",
                        }
                      )}
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
  );
}

export default InvoicePage;
