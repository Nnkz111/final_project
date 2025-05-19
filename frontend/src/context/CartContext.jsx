import React, { createContext, useState, useContext, useEffect } from "react";

// Create the Cart Context
const CartContext = createContext();

// Create a Cart Provider component
export const CartProvider = ({ children }) => {
  // We will now manage the cart item count here, fetched from the backend
  const [cartItemCount, setCartItemCount] = useState(0);

  // Function to fetch the latest cart count from the backend
  const fetchCartCount = async () => {
    const userId = 1; // *** Replace with actual user ID from authentication later ***
    try {
      const response = await fetch(
        `http://localhost:5000/api/cart/count/${userId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCartItemCount(data.count);
    } catch (error) {
      console.error(`Error fetching cart count for user ${userId}:`, error);
      setCartItemCount(0); // Set count to 0 on error
    }
  };

  // Fetch count when the provider mounts
  useEffect(() => {
    fetchCartCount();
  }, []);

  // Function to add an item to the cart
  const addToCart = (product) => {
    // Check if the item is already in the cart
    const existingItem = cartItems.find((item) => item.id === product.id);

    if (existingItem) {
      // If item exists, update the quantity
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // If item doesn't exist, add it with quantity 1
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  // You can add other cart functions here, like removeFromCart, updateQuantity, clearCart, etc.

  return (
    <CartContext.Provider
      value={{ cartItemCount, refreshCartCount: fetchCartCount }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the Cart Context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
