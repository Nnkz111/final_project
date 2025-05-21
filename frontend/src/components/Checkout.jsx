import React, { useContext, useState, useRef } from "react";
import { useCart } from "../context/CartContext";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Checkout() {
  const { cartItems, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: user?.name || "",
    address: "",
    phone: "",
    email: user?.email || "",
    payment_type: "cod",
    payment_proof: null,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const fileInputRef = useRef();

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
        name: user?.name || "",
        address: "",
        phone: "",
        email: user?.email || "",
        payment_type: "cod",
        payment_proof: null,
      });
      clearCart();
      navigate("/order-confirmation", { state: { orderId: resData.orderId } });
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

  return (
    <div className="container mx-auto mt-8 p-2 md:p-8 flex flex-col md:flex-row gap-8">
      {/* Order Summary Card */}
      <div className="w-full md:w-2/3">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            Order Summary
          </h2>
          <div className="flex flex-col gap-4">
            {cartItems.length === 0 ? (
              <p className="text-gray-600">Your cart is empty.</p>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100"
                >
                  <div>
                    <div className="font-semibold text-gray-800">
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </div>
                  </div>
                  <div className="text-green-700 font-bold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Total */}
          <div className="flex justify-end items-center border-t pt-4 mt-6">
            <div className="text-xl font-bold text-gray-800 mr-4">Total:</div>
            <div className="text-xl font-bold text-green-600">
              ${total.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
      {/* Shipping & Payment Form Card */}
      <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-lg p-6 border border-gray-100 flex flex-col gap-4 self-start">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Shipping & Payment
        </h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            required
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-green-400 outline-none"
            required
          />
          {/* Payment Type Selection */}
          <div>
            <label className="block font-semibold mb-2">Payment Type</label>
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
                Cash on Delivery
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
                Bank Transfer
              </label>
            </div>
          </div>
          {/* Payment Proof Upload (if bank transfer) */}
          {form.payment_type === "bank_transfer" && (
            <div>
              <label className="block font-semibold mb-2">
                Upload Payment Proof
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
            {loading ? "Placing Order..." : "Place Order"}
          </button>
          {success && (
            <div className="text-green-600 font-semibold text-center mt-2">
              {success}
            </div>
          )}
          {error && (
            <div className="text-red-600 font-semibold text-center mt-2">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Checkout;
