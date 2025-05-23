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
import AdminCustomerManagement from "./components/AdminCustomerManagement";
import AdminSalesPage from "./components/AdminSalesPage";
import CategoryPage from "./components/CategoryPage";
import UserProfilePage from "./pages/UserProfilePage";
import Breadcrumbs from "./components/Breadcrumbs";
import CategoryListPage from "./pages/CategoryListPage";
import ProductListPage from "./pages/ProductListPage";

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
  const isCategoryPage = location.pathname.startsWith("/category/");
  const isProfilePage = location.pathname.startsWith("/profile");
  const isHomePage = location.pathname === "/"; // Check if it's the homepage
  const isCategoryListPage = location.pathname === "/categories"; // Check if it's the category list page
  const isProductListPage = location.pathname === "/products"; // Check if it's the product list page

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {" "}
      {/* Customer layout container */}
      <Header showMegaDropdown={!isHomePage} />
      {/* Add Breadcrumbs here, show only if not homepage */}
      {!isHomePage && <Breadcrumbs />}
      {/* Sidebar and HeroSlider in the same row/section */}
      {/* Exclude sidebar and hero slider on specific pages like product detail, cart, etc., AND the category list page and product list page */}
      {!isProductDetail &&
        !isCart &&
        !isCheckout &&
        !isOrderConfirmation &&
        !isMyOrders &&
        !isCategoryPage &&
        !isProfilePage &&
        !isCategoryListPage &&
        !isProductListPage && ( // Add this condition
          <div className="container mx-auto flex flex-row items-stretch">
            <Sidebar />
            <HeroSlider />
          </div>
        )}
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
                <Route path="categories" element={<CategoryListPage />} />
                <Route path="products" element={<ProductListPage />} />
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
                <Route path="category/*" element={<CategoryPage />} />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute customerOnly={true}>
                      <UserProfilePage />
                    </ProtectedRoute>
                  }
                />
                {/* Fallback for unknown routes within customer area - will show "Customer Page Not Found" */}
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
                <Route path="customers" element={<AdminCustomerManagement />} />
                <Route path="sales" element={<AdminSalesPage />} />
                {/* Add other admin routes here (e.g., users, orders, settings) */}
                {/* Fallback for unknown routes within admin area - will show "Admin Page Not Found" */}
                <Route path="*" element={<div>Admin Page Not Found</div>} />
              </Route>

              {/* Catch-all for unmatched routes outside the defined structures - will show "Page Not Found - Global" */}
              <Route path="*" element={<div>Page Not Found - Global</div>} />
            </Routes>
          </CategoryProvider>
        </CartProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
