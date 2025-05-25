import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext"; // Use AuthContext

function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext); // Use login from AuthContext
  const navigate = useNavigate();

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {" "}
      {/* Center content vertically and horizontally */}
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-xl rounded-lg w-full max-w-md">
        {" "}
        {/* Wider container, rounded corners, stronger shadow */}
        <h3 className="text-3xl font-bold text-center mb-6 text-gray-800">
          {" "}
          {/* Larger title, stronger font, more margin */}
          Login
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
              Email or Username
            </label>
            <input
              type="text"
              placeholder="Email or Username"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
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
              Password
            </label>
            <input
              type="password"
              placeholder="Password"
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
              Login
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?
            <button
              onClick={handleRegisterClick}
              className="text-blue-600 hover:text-blue-800 font-medium ml-1 focus:outline-none"
            >
              Register here
            </button>
          </p>
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
                  Close
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
