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

  return (
    <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg">
      <h3 className="text-2xl font-bold text-center">Customer Login</h3>{" "}
      {/* Updated title */}
      <form onSubmit={handleSubmit}>
        <div className="mt-4">
          <div>
            <label className="block" htmlFor="emailOrUsername">
              Email or Username
            </label>
            <input
              type="text"
              placeholder="Email or Username"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
            />
          </div>
          <div className="mt-4">
            <label className="block" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-baseline justify-between">
            <button
              type="submit"
              className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900"
            >
              Login as Customer {/* Updated button text */}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Login;
