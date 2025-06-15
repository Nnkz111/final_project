import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Header from "./components/Header";
import MobileHeader from "./components/MobileHeader";
import ProductList from "./components/ProductList";
import MobileNavbar from "./components/MobileNavbar";

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

  const shouldShowHeroSection =
    !isProductDetail &&
    !isCart &&
    !isCheckout &&
    !isOrderConfirmation &&
    !isMyOrders &&
    !isCategoryPage &&
    !isProfilePage &&
    !isCategoryListPage &&
    !isProductListPage &&
    !location.pathname.startsWith("/search");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Responsive Header */}
      <div className="hidden md:block">
        <Header showMegaDropdown={!isHomePage} />
      </div>
      <div className="md:hidden">
        <MobileHeader />
      </div>

      {/* Breadcrumbs - Hide on mobile homepage */}
      {!isHomePage && (
        <div className="container mx-auto px-4 py-2 mt-0 md:mt-4">
          <Breadcrumbs />
        </div>
      )}

      <main className="flex-1 flex flex-col">
        {shouldShowHeroSection && (
          <>
            {/* Desktop Layout */}
            <div className="hidden md:block container mx-auto px-4">
              <div className="flex gap-6 my-6">
                <div className="w-64 flex-shrink-0">
                  <MegaSidebar />
                </div>
                <div className="flex-1 min-w-0">
                  {" "}
                  {/* min-w-0 prevents flex item from overflowing */}
                  <HeroSlider />
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden container mx-auto px-4 mt-2 mb-4">
              <HeroSlider />
            </div>
          </>
        )}

        <div className="container mx-auto px-4 py-4 flex-1">
          <Outlet />
        </div>
      </main>

      <Footer />

      {/* Mobile Navigation - Only show on mobile */}
      <div className="md:hidden">
        <MobileNavbar />
      </div>
    </div>
  );
};

const AdminAreaLayout = () => (
  <ProtectedRoute adminOnly={true}>
    <AdminLayout>
      <Outlet />
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

                {/* Customer Area Routes */}
                <Route path="/" element={<CustomerLayout />}>
                  <Route index element={<ProductList />} />
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
                  <Route path="*" element={<div>Page Not Found</div>} />
                </Route>

                {/* Admin Area Routes */}
                <Route path="/admin" element={<AdminAreaLayout />}>
                  <Route index element={<AdminDashboard />} />
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
                    path="reports/products"
                    element={<ProductsReportPage />}
                  />
                  <Route
                    path="reports/customers"
                    element={<CustomerReportPage />}
                  />
                  <Route path="reports/sales" element={<SalesReportsPage />} />
                  <Route path="*" element={<div>Admin Page Not Found</div>} />
                </Route>

                <Route path="*" element={<div>Page Not Found</div>} />
              </Routes>
            </Suspense>
          </CategoryProvider>
        </CartProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;
