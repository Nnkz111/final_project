import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "./LoadingSpinner";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const { t } = useTranslation();
  const query = useQuery();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const email = query.get("email");
  const token = query.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus("password_mismatch");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setStatus(data.error || "error");
      }
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="p-8 text-center text-red-600">
        {t("reset_password_invalid_link")}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md mt-12">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {t("reset_password_title")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              className="block text-gray-700 font-medium mb-1"
              htmlFor="newPassword"
            >
              {t("reset_password_new_label")}
            </label>
            <input
              type="password"
              id="newPassword"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label
              className="block text-gray-700 font-medium mb-1"
              htmlFor="confirmPassword"
            >
              {t("reset_password_confirm_label")}
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? <LoadingSpinner /> : t("reset_password_submit_button")}
          </button>
        </form>
        {status === "success" && (
          <div className="mt-4 text-green-600 text-center">
            {t("reset_password_success_message")}
          </div>
        )}
        {status === "password_mismatch" && (
          <div className="mt-4 text-red-600 text-center">
            {t("reset_password_mismatch_message")}
          </div>
        )}
        {status && status !== "success" && status !== "password_mismatch" && (
          <div className="mt-4 text-red-600 text-center">
            {t("reset_password_error_message")}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
