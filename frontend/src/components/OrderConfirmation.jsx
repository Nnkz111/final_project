import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";

function OrderConfirmation() {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <h2 className="text-3xl font-extrabold text-green-700 mb-2">
          Thank you for your order!
        </h2>
        {orderId ? (
          <p className="text-lg text-gray-700 mb-2">
            Your order ID is{" "}
            <span className="font-mono font-bold text-green-700 text-xl">
              #{orderId}
            </span>
            .
          </p>
        ) : (
          <p className="text-lg text-gray-700 mb-2">
            Your order has been placed.
          </p>
        )}

        {/* Order Details Section */}
        <div className="w-full mt-8 text-left">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Order Details
          </h3>
          {loading ? (
            <div className="text-gray-500">Loading order details...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : order ? (
            <div className="bg-gray-50 rounded-xl p-6 shadow flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="mb-2">
                  <span className="font-semibold">Order ID:</span>{" "}
                  <span className="font-mono">#{order.id}</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Status:</span>{" "}
                  <span className="capitalize">{order.status}</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Payment Type:</span>{" "}
                  <span className="capitalize">
                    {order.payment_type || "-"}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Shipping:</span>{" "}
                  {order.shipping_name}, {order.shipping_address},{" "}
                  {order.shipping_phone}, {order.shipping_email}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Created At:</span>{" "}
                  {order.created_at &&
                    new Date(order.created_at).toLocaleString()}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Items:</span>
                  <ul className="list-disc ml-6 mt-1">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item) => (
                        <li key={item.id} className="text-gray-700">
                          {item.name} x {item.quantity}{" "}
                          <span className="text-gray-500">
                            (${parseFloat(item.price).toFixed(2)} )
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">No items</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-10">
          <Link
            to="/my-orders"
            className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition duration-300 shadow-md text-center"
          >
            View My Orders
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto bg-green-100 text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-green-200 transition duration-200 border border-green-200 text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;
