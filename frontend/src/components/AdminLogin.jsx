import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AdminAuthContext from "../context/AdminAuthContext"; // Use AdminAuthContext

function AdminLogin() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  // Use the adminLogin function from AdminAuthContext
  const { adminLogin } = useContext(AdminAuthContext);
  const navigate = useNavigate();

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
    <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg">
      <h3 className="text-2xl font-bold text-center">Admin Login</h3>
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
              Login as Admin
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminLogin;
