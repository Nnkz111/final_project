import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext"; // Use AuthContext

function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext); // Use login from AuthContext
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(emailOrUsername, password);
    if (result.success) {
      alert("Login successful!");
      navigate("/"); // Always redirect customer to homepage
    } else {
      alert(`Login failed: ${result.error}`);
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
    </div>
  );
}

export default Login;
