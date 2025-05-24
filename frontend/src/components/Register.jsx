import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import AuthContext from "../context/AuthContext"; // Import AuthContext

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState(""); // Add state for name
  const { register } = useContext(AuthContext); // Use useContext to get the register function
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Remove axios call as it will be handled by AuthContext
    const result = await register(email, password, username, name); // Pass name to register function
    if (result.success) {
      // Removed alert, consider using a more modern notification
      navigate("/login"); // Redirect to login page on success
    } else {
      alert(`Registration failed: ${result.error}`); // Keep alert for failure for now
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
          Create Account
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
              Username
            </label>
            <input
              type="text"
              placeholder="Choose a username"
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
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
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
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
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
              Password
            </label>
            <input
              type="password"
              placeholder="Create a password"
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
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
