import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ProductList from "./components/ProductList";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { CategoryProvider } from "./context/CategoryContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import Breadcrumbs from "./components/Breadcrumbs";
import MegaSidebar from "./components/MegaSidebar";
import Footer from "./components/Footer";

import "./App.css"; // Keep this for any custom styles if needed, or remove if fully using Tailwind

const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const CustomerReportPage = lazy(() => import("./pages/CustomerReportPage"));
const SalesReportsPage = lazy(() => import("./pages/SalesReportsPage"));
const ProductsReportPage = lazy(() => import("./pages/ProductsReportPage"));
const ProductListPage = lazy(() => import("./pages/ProductListPage"));
const AdminNotificationsPage = lazy(() =>
  import("./pages/AdminNotificationsPage")
);
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));
const CategoryListPage = lazy(() => import("./pages/CategoryListPage"));
const ProductDetails = lazy(() => import("./components/ProductDetails"));
const Cart = lazy(() => import("./components/Cart"));
const AddProductForm = lazy(() => import("./components/AddProductForm"));
const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const AdminLogin = lazy(() => import("./components/AdminLogin"));
const AdminProductManagement = lazy(() =>
  import("./components/AdminProductManagement")
);
const AdminCategoryManagement = lazy(() =>
  import("./components/AdminCategoryManagement")
);
const HeroSlider = lazy(() => import("./components/HeroSlider"));
const Checkout = lazy(() => import("./components/Checkout"));
const OrderConfirmation = lazy(() => import("./components/OrderConfirmation"));
const MyOrders = lazy(() => import("./components/MyOrders"));
const AdminOrderManagement = lazy(() =>
  import("./components/AdminOrderManagement")
);
const AdminCustomerManagement = lazy(() =>
  import("./components/AdminCustomerManagement")
);
const AdminIncomeReportPage = lazy(() =>
  import("./components/AdminIncomeReportPage")
);
const CategoryPage = lazy(() => import("./components/CategoryPage"));
const AdminUserManagement = lazy(() =>
  import("./components/AdminUserManagement")
);
const InvoicePage = lazy(() => import("./components/InvoicePage"));

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
  const navigate = useNavigate();

  const [bannerHeight, setBannerHeight] = useState(0); // State to store banner height
  const bannerContainerRef = useRef(null); // Ref for the banner container

  // Measure banner height after render
  useEffect(() => {
    if (bannerContainerRef.current) {
      setBannerHeight(bannerContainerRef.current.offsetHeight);
    }
  }, [isHomePage]); // Re-measure if homepage status changes

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {" "}
      {/* Customer layout container */}
      <Header showMegaDropdown={!isHomePage} />
      {/* Display Breadcrumbs on non-homepage pages */}
      {!isHomePage && (
        <div className="container mx-auto p-4">
          <Breadcrumbs />
        </div>
      )}
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
        !isProductListPage &&
        !location.pathname.startsWith("/search") && (
          <div
            className="container mx-auto flex flex-row items-start relative"
            ref={bannerContainerRef}
          >
            {" "}
            {/* Use flexbox, align items to start, and add relative positioning */}
            <MegaSidebar
              className="w-64 flex-shrink-0"
              bannerHeight={bannerHeight}
            />{" "}
            {/* Use MegaSidebar, fixed width, and prevent shrinking */}
            <HeroSlider className="flex-grow" />{" "}
            {/* HeroSlider takes remaining width */}
          </div>
        )}
      {/* Product list and other content below */}
      {/* Adjusted padding for sticky header and dropdown */}
      <div className="container mx-auto flex-1 p-4">
        <Outlet />
      </div>
      <Footer />
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
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Customer Area Routes using CustomerLayout */}
                <Route path="/" element={<CustomerLayout />}>
                  {" "}
                  {/* Parent route for customer area */}
                  <Route index element={<ProductList />} />{" "}
                  {/* Root customer page */}
                  <Route path="categories" element={<CategoryListPage />} />
                  <Route path="products" element={<ProductListPage />} />
                  <Route path="products/:id" element={<ProductDetails />} />
                  <Route path="search" element={<SearchResultsPage />} />
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
                    path="order-confirmation/:orderId"
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
                  <Route
                    path="*"
                    element={<div>Customer Page Not Found</div>}
                  />
                </Route>

                {/* Top-level route for Search Results */}
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/invoice/:orderId" element={<InvoicePage />} />

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
                  <Route
                    path="customers"
                    element={<AdminCustomerManagement />}
                  />
                  <Route path="users" element={<AdminUserManagement />} />
                  <Route
                    path="notifications"
                    element={<AdminNotificationsPage />}
                  />
                  <Route path="sales" element={<AdminIncomeReportPage />} />
                  <Route
                    path="/admin/reports/products"
                    element={<ProductsReportPage />}
                  />
                  <Route
                    path="/admin/reports/customers"
                    element={<CustomerReportPage />}
                  />
                  <Route
                    path="/admin/reports/sales"
                    element={<SalesReportsPage />}
                  />
                  {/* Add other admin routes here (e.g., users, orders, settings) */}
                  {/* Fallback for unknown routes within admin area - will show "Admin Page Not Found" */}
                  <Route path="*" element={<div>Admin Page Not Found</div>} />
                </Route>

                {/* Catch-all for unmatched routes outside the defined structures - will show "Page Not Found - Global" */}
                <Route path="*" element={<div>Page Not Found - Global</div>} />
              </Routes>
            </Suspense>
          </CategoryProvider>
        </CartProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
