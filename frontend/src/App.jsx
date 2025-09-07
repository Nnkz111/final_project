import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import {
  Routes,
  Route,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import MobileHeader from "./components/MobileHeader";
import ProductList from "./components/ProductList";
import MobileNavbar from "./components/MobileNavbar";
import CategoryMegaDropdown from "./components/CategoryMegaDropdown";
import LoadingSpinner from "./components/LoadingSpinner";

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
const ResetPassword = lazy(() => import("./components/ResetPassword"));
const AdminEmployeeManagement = lazy(() =>
  import("./components/AdminEmployeeManagement")
);
const EmployeeReportPage = lazy(() => import("./pages/EmployeeReportPage"));
// const CategoryIncomeReportPage = lazy(() =>
//   import("./pages/CategoryIncomeReportPage")
// );

// Create layout components
const CustomerLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/"; // Check if it's the homepage
  const isProductDetail = location.pathname.startsWith("/products/");
  const isCart = location.pathname.startsWith("/cart");
  const isCheckout = location.pathname.startsWith("/checkout");
  const isOrderConfirmation = location.pathname.startsWith(
    "/order-confirmation"
  );
  const isMyOrders = location.pathname.startsWith("/my-orders");
  const isCategoryPage = location.pathname.startsWith("/category/");
  const isProfilePage = location.pathname.startsWith("/profile");
  const isCategoryListPage = location.pathname === "/categories"; // Check if it's the category list page
  const isProductListPage = location.pathname === "/products"; // Check if it's the product list page
  const navigate = useNavigate();

  const [bannerHeight, setBannerHeight] = useState(0); // State to store banner height
  const bannerContainerRef = useRef(null); // Ref for the banner container
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const { t } = useTranslation();

  // Measure banner height after render
  useEffect(() => {
    if (bannerContainerRef.current) {
      setBannerHeight(bannerContainerRef.current.offsetHeight);
    }
  }, [isHomePage]); // Re-measure if homepage status changes

  useEffect(() => {
    function handleMouseMove(e) {
      if (categoryDropdownOpen) {
        // Check if mouse is over button or dropdown
        const isOverButton = buttonRef.current?.contains(e.target);
        const isOverDropdown = dropdownRef.current?.contains(e.target);

        // Close dropdown if mouse is not over either
        if (!isOverButton && !isOverDropdown) {
          setCategoryDropdownOpen(false);
        }
      }
    }

    document.addEventListener("mouseover", handleMouseMove);
    return () => document.removeEventListener("mouseover", handleMouseMove);
  }, [categoryDropdownOpen]);

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
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="flex flex-col min-h-screen">
        <div className="hidden md:block sticky top-0 z-50">
          <div className="bg-gray-800">
            <Header showMegaDropdown={!isHomePage} />
          </div>
          {!isHomePage && (
            <div className="w-full bg-gray-800 border-t border-gray-700">
              <div className="container mx-auto">
                <button
                  ref={buttonRef}
                  className="text-white hover:text-green-400 transition-colors duration-200 flex items-center space-x-1 py-3 px-4 group"
                  onMouseEnter={() => setCategoryDropdownOpen(true)}
                >
                  <span>{t("Category")}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transform transition-transform duration-200 ${
                      categoryDropdownOpen ? "rotate-180" : ""
                    } group-hover:translate-y-0.5`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {categoryDropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute left-0 w-full bg-gray-800 shadow-lg"
                    onMouseLeave={() => setCategoryDropdownOpen(false)}
                  >
                    <CategoryMegaDropdown
                      onCategoryClick={() => setCategoryDropdownOpen(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="md:hidden">
          <MobileHeader />
        </div>{" "}
        {!isHomePage && (
          <div className="hidden md:block bg-gray-100 shadow-sm">
            <div className="container mx-auto">
              <div className="px-4 py-4 flex items-center justify-between">
                <Breadcrumbs />
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 flex flex-col">
          {shouldShowHeroSection && (
            <>
              <div className="hidden md:block container mx-auto px-4">
                <div className="flex">
                  {isHomePage && (
                    <div className="w-64 flex-shrink-0">
                      <MegaSidebar />
                    </div>
                  )}
                  <div
                    className={`flex-1 min-w-0 ${!isHomePage ? "w-full" : ""}`}
                  >
                    <HeroSlider />
                  </div>
                </div>
              </div>

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
        <div className="md:hidden">
          <MobileNavbar />
        </div>
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
            {" "}
            <Suspense
              fallback={
                <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="bg-white p-8 rounded-xl ">
                    <LoadingSpinner />
                  </div>
                </div>
              }
            >
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/invoice/:orderId" element={<InvoicePage />} />
                <Route path="/reset-password" element={<ResetPassword />} />

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
                  />{" "}
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
                  {/* Employee Management Route */}
                  <Route
                    path="employees"
                    element={<AdminEmployeeManagement />}
                  />
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
                  <Route
                    path="reports/employees"
                    element={
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <EmployeeReportPage />
                      </React.Suspense>
                    }
                  />

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
