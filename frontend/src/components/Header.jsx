import React from "react";
import { useCart } from "../context/CartContext";

function Header() {
  const { cartItems } = useCart();
  const cartItemCount = cartItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  return (
    <header className="bg-red-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo Area - adjusted size and margin */}
        <div className="text-3xl font-bold mr-6">OLAA</div>

        {/* Search Bar Area - more refined styling */}
        <div className="flex-grow mx-4 flex items-center bg-white rounded-md overflow-hidden">
          <input
            type="text"
            placeholder="Search for products..."
            className="w-full p-2 text-gray-800 outline-none"
          />
          {/* Search Icon Placeholder */}
          <button className="px-4 py-2 bg-gray-200 text-gray-600 hover:bg-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* User/Cart Icons Area - using flex and spacing */}
        <div className="flex items-center space-x-6 ml-6">
          {/* User Icon */}
          <div className="flex items-center flex-col text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>Account</span>
          </div>
          {/* Cart Icon with item count */}
          <div className="flex items-center flex-col text-sm relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
            <span>Cart</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
