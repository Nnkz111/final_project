import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; // Import useNavigate and Link
import AuthContext from "../context/AuthContext"; // Import AuthContext
import Header from "./Header"; // Import the Header component
import { useTranslation } from "react-i18next"; // Import useTranslation

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState(""); // Add state for name
  const { register } = useContext(AuthContext); // Use useContext to get the register function
  const navigate = useNavigate(); // Initialize useNavigate
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
    // Remove axios call as it will be handled by AuthContext
    const result = await register(email, password, username, name); // Pass name to register function
    if (result.success) {
      setAlertMessage(t("register_success_message")); // Use translation key
      setAlertType("success");
      setIsAlertModalOpen(true);
      // Delay navigation until after user closes the modal, or automatically after a few seconds
      setTimeout(() => {
        closeAlertModal();
        navigate("/login"); // Redirect to login page on success
      }, 3000); // Auto-close and navigate after 3 seconds
    } else {
      setAlertMessage(t("register_failed_message", { error: result.error })); // Use translation key with interpolation
      setAlertType("error");
      setIsAlertModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {" "}
      {/* Changed classes for layout */}
      <Header showMegaDropdown={false} /> {/* Add the Header component */}
      <div className="flex-grow flex items-center justify-center">
        {" "}
        {/* New container for centering form */}
        <div className="px-8 py-6 mt-4 text-left bg-white shadow-xl rounded-lg w-full max-w-md">
          {" "}
          {/* Keep original form container */}{" "}
          {/* Wider container, rounded corners, stronger shadow */}
          <h3 className="text-3xl font-bold text-center mb-6 text-gray-800">
            {" "}
            {/* Larger title, stronger font, more margin */}
            {t("register_page_title")}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {" "}
            {/* Added space between form groups */}
            <div>
              <label
                className="block text-gray-700 font-medium mb-1"
                htmlFor="username"
              >
                {" "}
                {/* Styled label */}
                {t("register_username_label")}
              </label>
              <input
                type="text"
                placeholder={t("register_username_placeholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              {" "}
              {/* Changed div structure for consistency */}
              <label
                className="block text-gray-700 font-medium mb-1"
                htmlFor="name"
              >
                {" "}
                {/* Styled label */}
                {t("register_name_label")}
              </label>
              <input
                type="text"
                placeholder={t("register_name_placeholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              {" "}
              {/* Changed div structure for consistency */}
              <label
                className="block text-gray-700 font-medium mb-1"
                htmlFor="email"
              >
                {" "}
                {/* Styled label */}
                {t("register_email_label")}
              </label>
              <input
                type="email"
                placeholder={t("register_email_placeholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              {" "}
              {/* Changed div structure for consistency */}
              <label
                className="block text-gray-700 font-medium mb-1"
                htmlFor="password"
              >
                {" "}
                {/* Styled label */}
                {t("register_password_label")}
              </label>
              <input
                type="password"
                placeholder={t("register_password_placeholder")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-baseline justify-center">
              {" "}
              {/* Centered button */}
              <button
                type="submit"
                className="px-8 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              >
                {t("register_button")}
              </button>
            </div>
          </form>
          {/* Link to Login Page */}
          <div className="mt-6 text-center">
            <p className="text-gray-700">
              {t("register_already_account_text")}
              <Link
                to="/login"
                className="text-blue-600 hover:underline ml-1 font-semibold"
              >
                {t("register_login_link")}
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Custom Alert Modal */}
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
              <p className="text-lg font-semibold">{alertMessage}</p>
            </div>
            {alertType === "error" && (
              <div className="mt-4 text-center">
                <button
                  onClick={closeAlertModal}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                >
                  {t("register_alert_close_button")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
