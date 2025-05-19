import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "./AuthContext";

// Create the Cart Context
const CartContext = createContext(null);

// Create a Cart Provider component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartItemCount, setCartItemCount] = useState(0);
  const { user, token, isLoading: isAuthLoading } = useContext(AuthContext);

  const API_URL = "http://localhost:5000/api";

  // Function to fetch cart items for the logged-in user
  const fetchCartItems = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/cart/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCartItems(response.data);
    } catch (error) {
      console.error(`Error fetching cart for user ${user.id}:`, error);
    }
  };

  // Function to fetch total item count for the logged-in user's cart
  const fetchCartCount = async () => {
    if (!user) {
      setCartItemCount(0);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/cart/count/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCartItemCount(response.data.count);
    } catch (error) {
      console.error(`Error fetching cart count for user ${user.id}:`, error);
    }
  };

  // Function to refresh cart data (items and count)
  const refreshCart = () => {
    fetchCartItems();
    fetchCartCount();
  };

  // Fetch cart data when the component mounts or user/token changes
  useEffect(() => {
    if (!isAuthLoading) {
      refreshCart();
    }
  }, [user, token, isAuthLoading]);

  // Functions to add, update, or remove items (will also need token)
  const addItemToCart = async (productId, quantity = 1) => {
    if (!user || !token) return;
    try {
      await axios.post(
        `${API_URL}/cart/add`,
        { productId, quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      refreshCart();
    } catch (error) {
      console.error("Error adding item to cart:", error);
    }
  };

  const updateCartItemQuantity = async (cartItemId, quantity) => {
    if (!user || !token) return;
    try {
      await axios.put(
        `${API_URL}/cart/update/${cartItemId}`,
        { quantity },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      refreshCart();
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
    }
  };

  const removeCartItem = async (cartItemId) => {
    if (!user || !token) return;
    try {
      await axios.delete(`${API_URL}/cart/remove/${cartItemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      refreshCart();
    } catch (error) {
      console.error("Error removing cart item:", error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartItemCount,
        refreshCart,
        addItemToCart,
        updateCartItemQuantity,
        removeCartItem,
      }}
    >
      {!isAuthLoading && children}
    </CartContext.Provider>
  );
};

// Custom hook to use the Cart Context
export const useCart = () => useContext(CartContext);
