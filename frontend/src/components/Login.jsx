import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { useTranslation } from "react-i18next";
import Header from "./Header";
import MobileHeader from "./MobileHeader";
import MobileNavbar from "./MobileNavbar";

function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext); // Use login from AuthContext
  const navigate = useNavigate();
  const { t } = useTranslation(); // Initialize useTranslation

  // State for custom alert modal
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success"); // 'success' or 'error'

  // Function to close the alert modal
  const closeAlertModal = () => {
    setIsAlertModalOpen(false);
    setAlertMessage("");
    setAlertType("success"); // Reset to default
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(emailOrUsername, password);
    if (result.success) {
      setAlertMessage("Login successful!");
      setAlertType("success");
      setIsAlertModalOpen(true);
      // Delay navigation slightly to allow modal to be seen, or navigate directly
      setTimeout(() => {
        closeAlertModal();
        navigate("/"); // Always redirect customer to homepage
      }, 1500); // Auto-close and navigate after 1.5 seconds
    } else {
      setAlertMessage(`Login failed: ${result.error}`);
      setAlertType("error");
      setIsAlertModalOpen(true);
    }
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Desktop Header */}
      <div className="hidden md:block sticky top-0 z-50 bg-gray-800 border-b border-gray-200">
        <Header showMegaDropdown={false} hideCart={true} hideAccount={true} />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <MobileHeader showBackButton={true} title={t("login_page_title")} />
      </div>

      <div className="flex-grow flex items-center justify-center mt-16 md:mt-4">
        <div className="px-8 py-6 mt-4 text-left bg-white shadow-xl rounded-lg w-full max-w-md">
          <h3 className="text-3xl font-bold text-center mb-6 text-gray-800">
            {t("login_page_title")}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                className="block text-gray-700 font-medium mb-1"
                htmlFor="emailOrUsername"
              >
                {t("login_email_username_label")}
              </label>
              <input
                type="text"
                placeholder={t("login_email_username_placeholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                className="block text-gray-700 font-medium mb-1"
                htmlFor="password"
              >
                {t("login_password_label")}
              </label>
              <input
                type="password"
                placeholder={t("login_password_placeholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-baseline justify-center">
              <button
                type="submit"
                className="px-8 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              >
                {t("login_button")}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t("login_no_account_text")}
              <button
                onClick={handleRegisterClick}
                className="text-blue-600 hover:text-blue-800 font-medium ml-1 focus:outline-none"
              >
                {t("login_register_link")}
              </button>
            </p>
          </div>
        </div>
      </div>
      {isAlertModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 bg-white rounded-lg shadow-xl max-w-sm mx-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
              onClick={closeAlertModal}
            >
              &times;
            </button>
            <div
              className={`text-center ${
                alertType === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              <p className="text-lg font-semibold">
                {alertType === "success"
                  ? t("login_success_message")
                  : t("login_failed_message", {
                      error: alertMessage.replace("Login failed: ", ""),
                    })}
              </p>
            </div>
            {alertType === "error" && (
              <div className="mt-4 text-center">
                <button
                  onClick={closeAlertModal}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                >
                  {t("login_alert_close_button")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
