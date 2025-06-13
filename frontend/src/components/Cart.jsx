import React, { useEffect, useState, useContext } from "react";
import { useCart } from "../context/CartContext"; // Import useCart hook
import AuthContext from "../context/AuthContext"; // Import AuthContext
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Cart() {
  // const { cartItems } = useCart(); // Not getting items from context anymore
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Get necessary functions from useCart context
  const { refreshCart, removeCartItem, updateCartItemQuantity } = useCart();
  const { user, token } = useContext(AuthContext); // Get user and token from AuthContext
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hasStockIssues, setHasStockIssues] = useState(false);

  // Function to fetch cart items from the backend
  const fetchCartItems = async () => {
    if (!user || !token) {
      // Also check for token
      setCartItems([]);
      setLoading(false); // Stop loading if no user or token
      return;
    }
    const userId = user.id; // Use user.id from context
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/api/cart/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Add Authorization header
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Convert price to number after fetching
      const itemsWithParsedPrice = data.map((item) => ({
        ...item,
        price: parseFloat(item.price), // Convert price to number
      }));
      setCartItems(itemsWithParsedPrice);
      setHasStockIssues(
        itemsWithParsedPrice.some((item) => item.quantity > item.stock_quantity)
      );
    } catch (error) {
      setError(error);
      console.error(`Error fetching cart for user ${userId}:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [user, token]); // Add token to dependency array

  // Function to handle removing an item from the cart
  const handleRemoveItem = async (cartItemId) => {
    // Use the removeCartItem function from CartContext
    await removeCartItem(cartItemId);
    // After successful removal, refetch the cart items to update the UI
    fetchCartItems();
    // refreshCartCount is called within removeCartItem in CartContext

    // Optional: Display user feedback
  };

  // Function to handle updating item quantity in the cart
  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    // Ensure newQuantity is a number and greater than 0
    if (isNaN(newQuantity) || newQuantity <= 0) {
      console.error("Invalid quantity");
      return;
    }

    // Find the item in the current cartItems state to get its stock
    const itemToUpdate = cartItems.find((item) => item.id === cartItemId);

    // Prevent updating quantity if it exceeds stock
    if (itemToUpdate && newQuantity > itemToUpdate.stock_quantity) {
      alert(`${t("out_of_stock")}: ${itemToUpdate.name}`);
      // Optionally, you can set the quantity to the max available stock instead of just alerting
      // handleUpdateQuantity(cartItemId, itemToUpdate.stock_quantity);
      return;
    }

    // Use the updateCartItemQuantity function from CartContext
    await updateCartItemQuantity(cartItemId, newQuantity);
    // After successful update, refetch the cart items to update the UI
    fetchCartItems();
    // refreshCartCount is called within updateCartItemQuantity in CartContext

    // Optional: Display user feedback
  };

  if (loading) {
    return (
      <div className="text-center text-gray-600 text-lg mt-8">
        {t("loading_cart")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 text-lg mt-8">
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-2 p-4 md:p-8 bg-white rounded-lg shadow-xl flex flex-col md:flex-row gap-8">
      {/* Cart Items Section */}
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          {t("cart_title")}
        </h2>
        {cartItems.length === 0 ? (
          <p className="text-gray-600">{t("cart_empty_message")}</p>
        ) : (
          <div className="flex flex-col gap-6">
            {cartItems.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row items-center bg-gray-50 rounded-xl shadow-sm p-4 gap-4 relative border border-gray-100"
              >
                {/* Product Image */}
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-gray-200">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                      {t("no_image_available")}
                    </div>
                  )}
                </div>
                {/* Product Info & Controls */}
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-1">
                      <span className="font-bold text-green-600 text-base">
                        {item.price.toLocaleString("lo-LA", {
                          style: "currency",
                          currency: "LAK",
                        })}
                      </span>{" "}
                      <span className="text-xs"></span>
                    </p>
                    {item.stock_quantity === 0 && (
                      <p className="text-red-500 text-sm font-semibold mt-1">
                        {t("out_of_stock")}
                      </p>
                    )}
                    {item.quantity > item.stock_quantity &&
                      item.stock_quantity > 0 && (
                        <p className="text-orange-500 text-sm font-semibold mt-1">
                          {t("insufficient_stock_for_quantity", {
                            available: item.stock_quantity,
                          })}
                        </p>
                      )}
                  </div>
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold hover:bg-gray-300 focus:ring-2 focus:ring-green-400 transition"
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      min="1"
                      className="w-12 text-center border border-gray-300 rounded focus:ring-2 focus:ring-green-400 outline-none"
                      onChange={(e) =>
                        handleUpdateQuantity(
                          item.id,
                          parseInt(e.target.value, 10)
                        )
                      }
                    />
                    <button
                      className="bg-gray-200 text-gray-700 w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold hover:bg-gray-300 focus:ring-2 focus:ring-green-400 transition"
                      onClick={() =>
                        handleUpdateQuantity(item.id, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.stock_quantity} // Disable if quantity reaches or exceeds stock
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  {/* Item Total */}
                  <div className="text-lg font-bold text-green-600 min-w-[80px] text-right">
                    {(item.price * item.quantity).toLocaleString("lo-LA", {
                      style: "currency",
                      currency: "LAK",
                    })}
                  </div>
                  {/* Remove Button */}
                  <button
                    className="ml-2 text-red-500 hover:bg-red-100 rounded-full p-2 transition flex items-center justify-center focus:ring-2 focus:ring-red-400"
                    onClick={() => handleRemoveItem(item.id)}
                    aria-label="Remove item"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                {/* Divider for all but last item */}
                {idx !== cartItems.length - 1 && (
                  <div className="absolute left-0 right-0 bottom-[-12px] h-[1px] bg-gray-200 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Cart Summary Section (sticky on desktop) */}
      {cartItems.length > 0 && (
        <div className="w-full md:w-80 md:sticky md:top-24 self-start">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="text-xl font-bold text-gray-800">
                {t("cart_total_label")}:
              </div>
              <div className="text-xl font-bold text-green-600">
                {cartItems
                  .reduce(
                    (total, item) => total + item.price * item.quantity,
                    0
                  )
                  .toLocaleString("lo-LA", {
                    style: "currency",
                    currency: "LAK",
                  })}
              </div>
            </div>
            {hasStockIssues && (
              <p className="text-red-600 text-center font-semibold mt-2">
                {t("out_of_stock")}
              </p>
            )}
            <button
              className={`px-6 py-3 rounded-lg text-lg font-semibold transition duration-300 w-full mt-2 shadow-md ${
                hasStockIssues
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
              onClick={() => navigate("/checkout")}
              disabled={hasStockIssues}
            >
              {t("proceed_to_checkout_button")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
