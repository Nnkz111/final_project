import React, { useEffect, useState, useContext } from "react";
import { useCart } from "../context/CartContext"; // Import useCart hook
import AuthContext from "../context/AuthContext"; // Import AuthContext

function Cart() {
  // const { cartItems } = useCart(); // Not getting items from context anymore
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Get necessary functions from useCart context
  const { refreshCart, removeCartItem, updateCartItemQuantity } = useCart();
  const { user, token } = useContext(AuthContext); // Get user and token from AuthContext

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
      const response = await fetch(`http://localhost:5000/api/cart/${userId}`, {
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
    console.log("Cart item removed!");
    // Optional: Display user feedback
  };

  // Function to handle updating item quantity in the cart
  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    // Ensure newQuantity is a number and greater than 0
    if (isNaN(newQuantity) || newQuantity <= 0) {
      console.error("Invalid quantity");
      return;
    }

    // Use the updateCartItemQuantity function from CartContext
    await updateCartItemQuantity(cartItemId, newQuantity);
    // After successful update, refetch the cart items to update the UI
    fetchCartItems();
    // refreshCartCount is called within updateCartItemQuantity in CartContext
    console.log("Cart item quantity updated!");
    // Optional: Display user feedback
  };

  if (loading) {
    return (
      <div className="text-center text-gray-600 text-lg mt-8">
        Loading cart...
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
    <div className="container mx-auto mt-8 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Shopping Cart</h2>
      {cartItems.length === 0 ? (
        <p className="text-gray-600">Your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center border-b pb-4">
              {/* Product Image */}
              <div className="w-16 h-16 rounded-md mr-4 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={`http://localhost:5000${item.image_url}`}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    ${item.price.toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center justify-end">
                  {/* Quantity Controls */}
                  <button
                    className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-l hover:bg-gray-300"
                    onClick={() =>
                      handleUpdateQuantity(item.id, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1} // Disable decrement if quantity is 1
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    className="w-12 text-center border-t border-b border-gray-200 outline-none"
                    onChange={(e) =>
                      handleUpdateQuantity(
                        item.id,
                        parseInt(e.target.value, 10)
                      )
                    }
                  />
                  <button
                    className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-r hover:bg-gray-300"
                    onClick={() =>
                      handleUpdateQuantity(item.id, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-lg font-bold text-green-600 ml-4">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
              {/* Remove Button */}
              <button
                className="text-red-600 hover:text-red-800 ml-4"
                onClick={() => handleRemoveItem(item.id)}
              >
                Remove
              </button>
            </div>
          ))}
          {/* Cart Total */}
          <div className="flex justify-end items-center border-t pt-4 mt-4">
            <div className="text-xl font-bold text-gray-800 mr-4">Total:</div>
            <div className="text-xl font-bold text-green-600">
              $
              {cartItems
                .reduce((total, item) => total + item.price * item.quantity, 0)
                .toFixed(2)}
            </div>
          </div>
          {/* Checkout Button - Placeholder for now */}
          <div className="flex justify-end mt-4">
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition duration-300">
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
