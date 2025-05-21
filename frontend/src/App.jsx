import React from "react";
import { Routes, Route, Outlet, useLocation } from "react-router-dom";
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
import AdminProductManagement from "./components/AdminProductManagement";
import AdminCategoryManagement from "./components/AdminCategoryManagement";
import HeroSlider from "./components/HeroSlider";
import Checkout from "./components/Checkout";
import OrderConfirmation from "./components/OrderConfirmation";
import MyOrders from "./components/MyOrders";
import AdminOrderManagement from "./components/AdminOrderManagement";
import "./App.css"; // Keep this for any custom styles if needed, or remove if fully using Tailwind

// Create layout components
const CustomerLayout = () => {
  const location = useLocation();
  const isProductDetail = location.pathname.startsWith("/products/");
  const isCart = location.pathname.startsWith("/cart");
  const isCheckout = location.pathname.startsWith("/checkout");
  const isOrderConfirmation = location.pathname.startsWith(
    "/order-confirmation"
  );
  const isMyOrders = location.pathname.startsWith("/my-orders");
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {" "}
      {/* Customer layout container */}
      <Header />
      {/* Sidebar and HeroSlider in the same row/section */}
      <div className="container mx-auto flex flex-row items-stretch">
        {/* Only show Sidebar and HeroSlider if not on product detail, cart, checkout, order confirmation, or my-orders page */}
        {!isProductDetail &&
          !isCart &&
          !isCheckout &&
          !isOrderConfirmation &&
          !isMyOrders && <Sidebar />}
        {!isProductDetail &&
          !isCart &&
          !isCheckout &&
          !isOrderConfirmation &&
          !isMyOrders && <HeroSlider />}
      </div>
      {/* Product list and other content below */}
      <div className="container mx-auto flex-1 p-4">
        <Outlet />
      </div>
    </div>
  );
};

const AdminAreaLayout = () => (
  <ProtectedRoute adminOnly={true}>
    {" "}
    {/* Protect the entire admin area */}
    <AdminLayout>
      {" "}
      {/* Admin layout container */}
      <Outlet /> {/* Renders the matched child route component */}
    </AdminLayout>
  </ProtectedRoute>
);

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

              {/* Customer Area Routes using CustomerLayout */}
              <Route path="/" element={<CustomerLayout />}>
                {" "}
                {/* Parent route for customer area */}
                <Route
                  index
                  element={
                    <ProtectedRoute customerOnly={true}>
                      <ProductList />
                    </ProtectedRoute>
                  }
                />{" "}
                {/* Root customer page */}
                <Route path="products/:id" element={<ProductDetails />} />
                <Route
                  path="cart"
                  element={
                    <ProtectedRoute customerOnly={true}>
                      <Cart />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="checkout"
                  element={
                    <ProtectedRoute customerOnly={true}>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="order-confirmation"
                  element={<OrderConfirmation />}
                />
                <Route
                  path="my-orders"
                  element={
                    <ProtectedRoute customerOnly={true}>
                      <MyOrders />
                    </ProtectedRoute>
                  }
                />
                {/* Add other customer-specific routes here (e.g., /profile, /orders) */}
                {/* Fallback for unknown routes within customer area - could be a 404 */}
                <Route path="*" element={<div>Customer Page Not Found</div>} />
              </Route>

              {/* Admin Area Routes using AdminAreaLayout */}
              <Route path="/admin" element={<AdminAreaLayout />}>
                {" "}
                {/* Parent route for admin area */}
                <Route index element={<AdminDashboard />} />{" "}
                {/* Admin Dashboard as the index route for /admin */}
                <Route
                  path="analytics"
                  element={<div>Admin Analytics Page</div>}
                />
                <Route path="products" element={<AdminProductManagement />} />
                <Route
                  path="categories"
                  element={<AdminCategoryManagement />}
                />
                <Route path="orders" element={<AdminOrderManagement />} />
                {/* Add other admin routes here (e.g., users, orders, settings) */}
                {/* Fallback for unknown routes within admin area - could be a 404 */}
                <Route path="*" element={<div>Admin Page Not Found</div>} />
              </Route>

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
