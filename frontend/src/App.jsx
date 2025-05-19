import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ProductList from "./components/ProductList";
import ProductDetails from "./components/ProductDetails";
import Cart from "./components/Cart";
import AddProductForm from "./components/AddProductForm";
import { CartProvider } from "./context/CartContext";
import "./App.css"; // Keep this for any custom styles if needed, or remove if fully using Tailwind

function App() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="container mx-auto flex">
          <Sidebar />
          <div className="flex-1 p-4">
            <Routes>
              <Route path="/" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/add-product" element={<AddProductForm />} />
            </Routes>
          </div>
        </div>
      </div>
    </CartProvider>
  );
}

export default App;
