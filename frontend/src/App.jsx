import React from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ProductList from "./components/ProductList";
import ProductDetails from "./components/ProductDetails";
import Cart from "./components/Cart";
import AddProductForm from "./components/AddProductForm";
import Login from "./components/Login";
import Register from "./components/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { CategoryProvider } from "./context/CategoryContext";
import "./App.css"; // Keep this for any custom styles if needed, or remove if fully using Tailwind

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <CategoryProvider>
          <div className="min-h-screen bg-gray-100">
            <Header />
            <div className="container mx-auto flex">
              <Sidebar />
              <div className="flex-1 p-4">
                <Routes>
                  <Route path="/" element={<ProductList />} />
                  <Route path="/products/:id" element={<ProductDetails />} />
                  <Route
                    path="/cart"
                    element={
                      <ProtectedRoute>
                        <Cart />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/add-product"
                    element={
                      <ProtectedRoute adminOnly={true}>
                        <AddProductForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </Routes>
              </div>
            </div>
          </div>
        </CategoryProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
