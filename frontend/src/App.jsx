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
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./components/AdminDashboard";
import AdminLogin from "./components/AdminLogin";
import "./App.css"; // Keep this for any custom styles if needed, or remove if fully using Tailwind

function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <CartProvider>
          <CategoryProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Customer Area Routes with Header and Sidebar */}
              <Route
                path="/"
                element={
                  <div className="min-h-screen bg-gray-100">
                    {" "}
                    {/* Customer layout container */}
                    <Header />
                    <div className="container mx-auto flex">
                      <Sidebar />
                      <div className="flex-1 p-4">
                        {" "}
                        {/* Main content area for customer */}
                        <Routes>
                          {" "}
                          {/* Nested Routes for customer pages */}
                          <Route
                            index
                            element={
                              <ProtectedRoute customerOnly={true}>
                                <ProductList />
                              </ProtectedRoute>
                            }
                          />{" "}
                          {/* Root customer page */}
                          <Route
                            path="products/:id"
                            element={<ProductDetails />}
                          />
                          <Route
                            path="cart"
                            element={
                              <ProtectedRoute customerOnly={true}>
                                <Cart />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="add-product"
                            element={
                              <ProtectedRoute adminOnly={true}>
                                <AddProductForm />
                              </ProtectedRoute>
                            }
                          />
                          {/* Add other customer-specific routes here (e.g., /profile, /orders) */}
                          {/* Fallback for unknown routes within customer area - could be a 404 */}
                          <Route
                            path="*"
                            element={<div>Customer Page Not Found</div>}
                          />
                        </Routes>
                      </div>
                    </div>
                  </div>
                }
              />

              {/* Admin Area Routes with AdminLayout */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly={true}>
                    {" "}
                    {/* Protect the entire admin area */}
                    <AdminLayout>
                      {" "}
                      {/* Admin layout container */}
                      <Routes>
                        {" "}
                        {/* Nested Routes for admin pages, paths are relative to /admin */}
                        <Route index element={<AdminDashboard />} />{" "}
                        {/* Admin Dashboard as the index route for /admin */}
                        <Route
                          path="analytics"
                          element={<div>Admin Analytics Page</div>}
                        />
                        <Route
                          path="products"
                          element={<div>Admin Products Page</div>}
                        />
                        {/* Add other admin routes here (e.g., users, orders, settings) */}
                        {/* Fallback for unknown routes within admin area - could be a 404 */}
                        <Route
                          path="*"
                          element={<div>Admin Page Not Found</div>}
                        />
                      </Routes>
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all for unmatched routes outside the defined structures - could be a global 404 */}
              <Route path="*" element={<div>Page Not Found - Global</div>} />
            </Routes>
          </CategoryProvider>
        </CartProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
