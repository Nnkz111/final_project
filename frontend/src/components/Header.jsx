import React from "react";

function Header() {
  return (
    <header className="bg-red-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo Area */}
        <div className="text-2xl font-bold">Your Logo</div>

        {/* Search Bar Area */}
        <div className="flex-grow mx-4">
          <input
            type="text"
            placeholder="Search..."
            className="w-full p-2 rounded text-gray-800"
          />
        </div>

        {/* User/Cart Icons Area */}
        <div className="flex items-center space-x-4">
          <span>User Icon</span>
          <span>Cart Icon</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
