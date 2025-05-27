import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { useTranslation } from "react-i18next";

function MyOrders() {
  const { user, token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    if (!user || !token) return;
    const fetchOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `http://localhost:5000/api/orders/user/${user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, token]);

  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center bg-gradient-to-br from-green-50 to-white py-12 px-2">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-8 border border-green-100">
        <h2 className="text-3xl font-extrabold text-green-700 mb-8 text-center">
          {t("my_orders_title")}
        </h2>
        {loading ? (
          <div className="text-gray-500 text-center">{t("loading_orders")}</div>
        ) : error ? (
          <div className="text-red-500 text-center">
            {t("error_message", { message: error })}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-gray-500 text-center">
            {t("no_orders_message")}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-gray-50 rounded-xl shadow p-6 flex flex-col md:flex-row md:items-center gap-4 border border-gray-200"
              >
                <div className="flex-1">
                  <div className="mb-1 font-semibold">
                    {t("order_id_label")}:{" "}
                    <span className="font-mono">#{order.id}</span>
                  </div>
                  <div className="mb-1">
                    {t("status_label")}:{" "}
                    <span className="capitalize font-semibold text-green-700">
                      {t(`order_status_${order.status}`)}
                    </span>
                  </div>
                  <div className="mb-1">
                    {t("created_label")}:{" "}
                    {order.created_at &&
                      new Date(order.created_at).toLocaleString()}
                  </div>
                  <div className="mb-1">
                    {t("items_label")}: {order.item_count}
                  </div>
                  <div className="mb-1">
                    {t("total_label")}:{" "}
                    <span className="font-bold text-green-600">
                      {parseFloat(order.total).toLocaleString("lo-LA", {
                        style: "currency",
                        currency: "LAK",
                      })}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/order-confirmation`}
                  state={{ orderId: order.id }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center"
                >
                  {t("view_details_button")}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
