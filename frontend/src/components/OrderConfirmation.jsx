import React, { useEffect, useState } from "react";
import { useLocation, Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
function OrderConfirmation() {
  const location = useLocation();
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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center bg-gradient-to-br from-green-50 to-white py-12 px-0">
      <div className="w-full bg-white rounded-none md:rounded-3xl shadow-2xl p-4 md:p-12 flex flex-col items-center text-center border border-green-100">
        {/* Success Icon */}
        <div className="bg-green-100 rounded-full p-4 mb-4">
          <svg
            className="w-16 h-16 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="w-full flex justify-between items-center mb-4">
          <h2 className="text-3xl font-extrabold text-green-700 text-center flex-grow">
            {t("order_confirmation_title")}{" "}
          </h2>{" "}
          {orderId && (
            <Link
              to={`/invoice/${orderId}`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow text-center text-sm"
            >
              {t("view_invoice_button")}
            </Link>
          )}
        </div>
        {orderId ? (
          <p className="text-lg text-gray-700 mb-2">
            {t("order_id_message")}{" "}
            <span className="font-mono font-bold text-green-700 text-xl">
              #{orderId}
            </span>
            .
          </p>
        ) : (
          <p className="text-lg text-gray-700 mb-2">
            {t("order_placed_message")}
          </p>
        )}

        {/* Separator */}
        <div className="w-full border-t border-gray-200 my-8"></div>

        {/* Order Details Section */}
        <div className="w-full mt-8 text-left">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {t("order_details_title")}
          </h3>
          {loading ? (
            <div className="text-gray-500">{t("loading_order_details")}</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : order ? (
            <div className="bg-gray-50 rounded-xl p-6 shadow grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {/* Left Column for textual details */}
              <div className="md:col-span-1 flex flex-col">
                <div className="mb-2">
                  <span className="font-semibold">{t("name_label")}:</span>{" "}
                  <span className=""> {order.shipping_name} </span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">
                    {t("order_id_label_details")}:
                  </span>{" "}
                  <span className="font-mono">#{order.id}</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">
                    {t("payment_type_label")}:
                  </span>{" "}
                  <span className="capitalize">
                    {t(`payment_type_${order.payment_type || "-"}`)}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">
                    {t("status_label_details")}:
                  </span>{" "}
                  <span className="capitalize font-semibold text-green-700">
                    {t(`order_status_${order.status}`)}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">{t("shipping_label")}:</span>{" "}
                  <p className="mr-2">{order.shipping_address}</p>
                  <p className="mr-2">
                    <span className="font-semibold">{t("phone_label")}:</span>{" "}
                    {order.shipping_phone}
                  </p>
                  <p>
                    <span className="font-semibold">{t("email_label")}:</span>{" "}
                    {order.shipping_email}
                  </p>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">
                    {t("created_at_label")}:
                  </span>{" "}
                  {order.created_at &&
                    new Date(order.created_at).toLocaleString()}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">
                    {t("items_label_details")}:
                  </span>{" "}
                  <ul className="list-disc ml-6 mt-1">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item) => (
                        <li key={item.id} className="text-gray-700">
                          {item.name} x {item.quantity}{" "}
                          <span className="font-semibold text-green-700">
                            (
                            {parseFloat(item.price).toLocaleString("lo-LA", {
                              style: "currency",
                              currency: "LAK",
                            })}{" "}
                            )
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">{t("no_items_message")}</li>
                    )}
                  </ul>
                </div>
              </div>
              {/* Right Column for Shipping Bill and Total */}
              <div className="md:col-span-1 flex flex-col md:items-end">
                {order.shipping_bill_url && (
                  <div className="mt-4 md:mt-0">
                    <span className="font-semibold block mb-1">
                      {t("shipping_bill_label")}:
                    </span>
                    <a
                      href={order.shipping_bill_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={order.shipping_bill_url}
                        alt={t("shipping_bill_alt_text")}
                        className="w-48 h-48 object-contain rounded-lg border border-green-200 shadow"
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Total Amount Display - Moved to top right of buttons */}
        {order && order.total && (
          <div className="w-full flex justify-end mb-4 pr-6">
            <div className="text-right">
              <span className="font-semibold text-lg">
                {t("total_amount_label")}:
              </span>{" "}
              <span className="font-bold text-green-700 text-xl">
                {parseFloat(order.total).toLocaleString("lo-LA", {
                  style: "currency",
                  currency: "LAK",
                })}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-10">
          <Link
            to="/my-orders"
            className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition duration-300 shadow-md text-center"
          >
            {t("view_my_orders_button")}{" "}
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto bg-green-100 text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-green-200 transition duration-200 border border-green-200 text-center"
          >
            {t("back_to_home_button")}{" "}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;
