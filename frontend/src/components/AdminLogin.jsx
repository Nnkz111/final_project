import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AdminAuthContext from "../context/AdminAuthContext";
import { useTranslation } from "react-i18next";

function AdminLogin() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  // Use the adminLogin function from AdminAuthContext
  const { adminLogin } = useContext(AdminAuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await adminLogin(emailOrUsername, password);
    if (result.success) {
      alert("Admin Login successful!");
      navigate("/admin"); // Always redirect admin to admin dashboard
    } else {
      alert(`Admin Login failed: ${result.error}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {" "}
      {/* Center content vertically and horizontally */}
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-xl rounded-lg w-full max-w-md">
        {" "}
        {/* Wider container, rounded corners, stronger shadow */}
        <h3 className="text-3xl font-bold text-center mb-6 text-gray-800">
          {" "}
          {/* Larger title, stronger font, more margin */}
          ເຂົ້າສູ່ລະບົບ
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {" "}
          {/* Added space between form groups */}
          <div>
            <label
              className="block text-gray-700 font-medium mb-1"
              htmlFor="emailOrUsername"
            >
              {" "}
              {/* Styled label */}
              ຊື່ຜູ້ໃຊ້
            </label>
            <div className="flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition duration-200">
              {/* User Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400 mx-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <input
                type="text"
                placeholder="ຊື່ຜູ້ໃຊ້"
                className="w-full px-3 py-2 text-gray-800 outline-none"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            {" "}
            <label
              className="block text-gray-700 font-medium mb-1"
              htmlFor="password"
            >
              {" "}
              {/* Styled label */}
              ລະຫັດຜ່ານ
            </label>
            <div className="flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition duration-200">
              {/* Lock Key Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400 mx-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2v5a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h6zm0 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0h6"
                />
              </svg>
              <input
                type="password"
                placeholder="ລະຫັດຜ່ານ"
                className="w-full px-3 py-2 text-gray-800 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex items-baseline justify-center">
            {" "}
            {/* Centered button */}
            <button
              type="submit"
              className="px-8 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
            >
              ເຂົ້າສູ່ລະບົບ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
