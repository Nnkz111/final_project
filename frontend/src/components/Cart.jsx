import React, { useEffect, useState } from "react";
// We will no longer directly use useCart to get cart items here,
// but might use it later for actions like removing items.
// import { useCart } from '../context/CartContext';

function Cart() {
  // const { cartItems } = useCart(); // Not getting items from context anymore
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCartItems = async () => {
      const userId = 1; // *** Replace with actual user ID from authentication later ***
      try {
        const response = await fetch(
          `http://localhost:5000/api/cart/${userId}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCartItems(data);
      } catch (error) {
        setError(error);
        console.error(`Error fetching cart for user ${userId}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, []); // Empty dependency array means this effect runs once on mount

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
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  {item.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  Quantity: {item.quantity}
                </p>
              </div>
              <div className="text-lg font-bold text-green-600">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
              {/* Add remove button later */}
            </div>
          ))}
          {/* Add total and checkout button later */}
        </div>
      )}
    </div>
  );
}

export default Cart;
