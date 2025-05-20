import React from "react";

function TopSellingProducts() {
  // Dummy data for top selling products based on the image
  const topProducts = [
    {
      name: "Air Jordan 8",
      quantity: "752 Pcs",
      image: "/placeholder-shoe.png",
    },
    {
      name: "Air Jordan 5",
      quantity: "752 Pcs",
      image: "/placeholder-shoe2.png",
    },
    {
      name: "Air Jordan 13",
      quantity: "752 Pcs",
      image: "/placeholder-shoe3.png",
    },
    {
      name: "Nike Air Max",
      quantity: "752 Pcs",
      image: "/placeholder-shoe4.png",
    },
    // Add more products as needed
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-6">
      {" "}
      {/* Section container */}
      <h3 className="text-lg font-semibold text-gray-800">
        Top Selling Products
      </h3>
      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
        {" "}
        {/* Responsive grid for products */}
        {topProducts.map((product, index) => (
          <div key={index} className="flex flex-col items-center text-center">
            {" "}
            {/* Product card */}
            <img
              src={product.image}
              alt={product.name}
              className="w-24 h-24 object-cover rounded-md"
            />{" "}
            {/* Placeholder image */}
            <p className="text-sm font-medium text-gray-800 mt-2 truncate w-full">
              {product.name}
            </p>
            <p className="text-xs text-gray-600">{product.quantity}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TopSellingProducts;
