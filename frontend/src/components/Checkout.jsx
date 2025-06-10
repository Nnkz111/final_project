import React, { useContext, useState, useRef, useEffect } from "react";
import { useCart } from "../context/CartContext";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import QrModal from "./QrModal";

function Checkout() {
  const { cartItems, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: user?.customer?.name || "",
    address: user?.customer?.address || "",
    phone: user?.customer?.phone || "",
    email: user?.email || "",
    payment_type: "cod",
    payment_proof: null,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const { t } = useTranslation();

  const [modalImageUrl, setModalImageUrl] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "payment_proof") {
      setForm({ ...form, payment_proof: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = new FormData();
      data.append("userId", user?.id);
      data.append("items", JSON.stringify(cartItems));
      data.append(
        "shipping",
        JSON.stringify({
          name: form.name,
          address: form.address,
          phone: form.phone,
          email: form.email,
        })
      );
      data.append("payment_type", form.payment_type);
      if (form.payment_type === "bank_transfer" && form.payment_proof) {
        data.append("payment_proof", form.payment_proof);
      }
      const response = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        body: data,
      });
      if (!response.ok) throw new Error("Order failed. Please try again.");
      const resData = await response.json();
      setSuccess("Order placed successfully!");
      setForm({
        name: user?.customer?.name || "",
        address: user?.customer?.address || "",
        phone: user?.customer?.phone || "",
        email: user?.email || "",
        payment_type: "cod",
        payment_proof: null,
      });
      clearCart();
      navigate(`/order-confirmation/${resData.orderId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const openModal = (imageUrl) => {
    setModalImageUrl(imageUrl);
  };

  const closeModal = () => {
    setModalImageUrl(null);
  };

  // Add useEffect to fetch fresh user data when component mounts or user changes
  useEffect(() => {
    const fetchFreshUserData = async () => {
      const token = localStorage.getItem("customerToken");
      if (!user || !token) {
        // User not logged in, form will remain with initial empty state
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const freshUser = await response.json();
          setForm((prevForm) => ({
            ...prevForm,
            name: freshUser.customer?.name || "",
            address: freshUser.customer?.address || "",
            phone: freshUser.customer?.phone || "",
            email: freshUser.email || "",
          }));
        } else {
          console.error("Failed to fetch fresh user data:", response.status);
        }
      } catch (error) {
        console.error("Error fetching fresh user data:", error);
      }
    };

    fetchFreshUserData();
  }, [user]); // Also depend on user here, though mainly for initial load/login

  return (
    <div className="container mx-auto mt-8 p-2 md:p-8 flex flex-col md:flex-row gap-8">
      {/* Order Summary Card */}
      <div className="w-full md:w-2/3">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            {t("order_summary_title")}
          </h2>
          <div className="flex flex-col gap-4">
            {cartItems.length === 0 ? (
              <p className="text-gray-600">{t("cart_empty_message")}</p>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100"
                >
                  {/* Product Image */}
                  {item.image_url && (
                    <div className="w-16 h-16 overflow-hidden rounded-md mr-4 flex-shrink-0">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {/* Product Info (Name and Quantity) */}
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="font-semibold text-gray-800 truncate">
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {t("quantity_label")}: {item.quantity}
                    </div>
                  </div>
                  {/* Product Price */}
                  <div className="text-green-600 font-bold flex-shrink-0">
                    {(item.price * item.quantity).toLocaleString("lo-LA", {
                      style: "currency",
                      currency: "LAK",
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Total */}
          <div className="flex justify-end items-center border-t pt-4 mt-6">
            <div className="text-xl font-bold text-gray-800 mr-4">
              {t("checkout_total_label")}:
            </div>
            <div className="text-xl font-bold text-green-600">
              {total.toLocaleString("lo-LA", {
                style: "currency",
                currency: "LAK",
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Shipping & Payment Form Card */}
      <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex flex-col gap-4 self-start">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {t("shipping_address_title")} & {t("payment_information_title")}
        </h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder={t("name_placeholder")}
            value={form.name}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            required
          />
          <input
            type="text"
            name="address"
            placeholder={t("address_placeholder")}
            value={form.address}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder={t("phone_number_label")}
            value={form.phone}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            required
          />
          <input
            type="email"
            name="email"
            placeholder={t("email_label")}
            value={form.email}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            required
          />
          {/* Payment Type Selection */}
          <div>
            <label className="block font-semibold mb-2">
              {t("payment_type_label")}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="payment_type"
                  value="cod"
                  checked={form.payment_type === "cod"}
                  onChange={handleChange}
                  className="accent-green-600"
                />
                {t("cash_on_delivery_option")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="payment_type"
                  value="bank_transfer"
                  checked={form.payment_type === "bank_transfer"}
                  onChange={handleChange}
                  className="accent-green-600"
                />
                {t("bank_transfer_option")}
              </label>
            </div>
          </div>
          {/* Payment Proof Upload (if bank transfer) */}
          {form.payment_type === "bank_transfer" && (
            <div>
              {/* QR Code Image Section */}
              <div className="mb-4">
                <h4 className="text-lg font-semibold mb-2">
                  Scan to Pay (Bank Transfer)
                </h4>
                {/* Make the image clickable */}
                <img
                  src="https://res.cloudinary.com/dgfk0ljyq/image/upload/v1748901020/Qr-bcel_x58vwf.jpg"
                  alt="Bank Transfer QR Code"
                  className="mx-auto w-48 h-48 object-contain border rounded-md p-2 cursor-pointer"
                  onClick={() =>
                    openModal(
                      "https://res.cloudinary.com/dgfk0ljyq/image/upload/v1748901020/Qr-bcel_x58vwf.jpg"
                    )
                  }
                />
              </div>
              <label className="block font-semibold mb-2">
                {t("upload_payment_proof_label")}
              </label>
              <input
                type="file"
                name="payment_proof"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleChange}
                className="border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition duration-300 w-full mt-2 shadow-md disabled:opacity-60"
            disabled={loading}
          >
            {loading ? t("processing_order_message") : t("place_order_button")}
          </button>
          {success && (
            <div className="text-green-600 font-semibold text-center mt-2">
              {success}
            </div>
          )}
          {error && (
            <div className="text-red-600 font-semibold text-center mt-2">
              {t("order_failed_message")}
            </div>
          )}
        </form>
      </div>

      {/* Render the modal */}
      <QrModal imageUrl={modalImageUrl} onClose={closeModal} />
    </div>
  );
}

export default Checkout;
