import React from "react";

function Sidebar() {
  return (
    <aside className="w-64 p-6 bg-white shadow-md rounded-lg mr-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Categories</h2>
      <nav>
        <ul>
          {/* Placeholder Category Links */}
          <li className="mb-2">
            <a href="#" className="text-gray-600 hover:text-red-600">
              Electronics
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="text-gray-600 hover:text-red-600">
              Clothing
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="text-gray-600 hover:text-red-600">
              Home & Garden
            </a>
          </li>
          {/* Add more categories here */}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
