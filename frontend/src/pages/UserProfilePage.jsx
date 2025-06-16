import React, { useContext, useState, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function UserProfilePage() {
  const { user, updateUser } = useContext(AuthContext);
  const [profileFormData, setProfileFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    name: user?.customer?.name || "",
    phone: user?.customer?.phone || "",
    address: user?.customer?.address || "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState(null);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("customerToken");
      if (!user || !token) {
        console.log(
          "User not logged in or token missing. Cannot fetch profile."
        );
        return;
      }

      try {
        const API_URL =
          import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${API_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("customerToken")}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          console.error(
            "Authentication failed to fetch profile.",
            response.status
          );
          localStorage.removeItem("customerToken");
          throw new Error(
            "Authentication required to view profile. Please log in again."
          );
        } else if (!response.ok) {
          throw new Error(
            `Failed to fetch profile: ${response.status} ${response.statusText}`
          );
        }

        const userProfile = await response.json();
        setProfileFormData({
          username: userProfile.username || "",
          email: userProfile.email || "",
          name: userProfile.customer?.name || "",
          phone: userProfile.customer?.phone || "",
          address: userProfile.customer?.address || "",
        });
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData({ ...profileFormData, [name]: value });
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData({ ...passwordFormData, [name]: value });
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("customerToken")}`,
        },
        body: JSON.stringify({
          email: profileFormData.email,
          name: profileFormData.name,
          phone: profileFormData.phone,
          address: profileFormData.address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedUser = await response.json();
      setSuccess(true);
      updateUser({
        ...user,
        username: updatedUser.username,
        email: updatedUser.email,
        customer_name: updatedUser.customer?.name,
        customer_phone: updatedUser.customer?.phone,
        customer_address: updatedUser.customer?.address,
      });

      // Show success message for 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    if (passwordFormData.newPassword !== passwordFormData.confirmNewPassword) {
      setChangePasswordError("New passwords do not match");
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordError(null);
    setChangePasswordSuccess(false);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${API_URL}/api/profile/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("customerToken")}`,
        },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password");
      }

      setChangePasswordSuccess(true);
      setPasswordFormData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setIsChangingPassword(false);
    } catch (err) {
      setChangePasswordError(err.message);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>{t("profile_login_prompt")}</p>
        <Link to="/login" className="text-green-600 hover:underline mt-4 block">
          {t("go_to_login_link")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
          {t("user_profile_title")}
        </h1>

        <form onSubmit={handleSubmitProfile} className="space-y-4">
          <div>
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="username"
            >
              {t("username_label")}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={profileFormData.username}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              disabled
            />
          </div>

          <div>
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="email"
            >
              {t("email_label")}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileFormData.email}
              onChange={handleProfileFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="name"
            >
              {t("name_label")}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={profileFormData.name}
              onChange={handleProfileFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="phone"
            >
              {t("phone_number_label")}
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={profileFormData.phone}
              onChange={handleProfileFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="address"
            >
              {t("address_label")}
            </label>
            <textarea
              id="address"
              name="address"
              value={profileFormData.address}
              onChange={handleProfileFormChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("saving_changes_message") : t("save_changes_button")}
            </button>
            <button
              type="button"
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="w-full sm:w-auto bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
            >
              {t("change_password_button")}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm mt-4">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm mt-4">
              {t("profile_updated_success_message")}
            </div>
          )}
        </form>

        {isChangingPassword && (
          <div className="mt-8 pt-6 border-t">
            <h2 className="text-lg font-bold mb-4">
              {t("change_password_title")}
            </h2>
            <form onSubmit={handleSubmitPasswordChange} className="space-y-4">
              <div>
                <label
                  className="block text-gray-700 text-sm font-semibold mb-2"
                  htmlFor="current-password"
                >
                  {t("current_password_label")}
                </label>
                <input
                  type="password"
                  id="current-password"
                  name="currentPassword"
                  value={passwordFormData.currentPassword}
                  onChange={handlePasswordFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-semibold mb-2"
                  htmlFor="new-password"
                >
                  {t("new_password_label")}
                </label>
                <input
                  type="password"
                  id="new-password"
                  name="newPassword"
                  value={passwordFormData.newPassword}
                  onChange={handlePasswordFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  className="block text-gray-700 text-sm font-semibold mb-2"
                  htmlFor="confirm-new-password"
                >
                  {t("confirm_new_password_label")}
                </label>
                <input
                  type="password"
                  id="confirm-new-password"
                  name="confirmNewPassword"
                  value={passwordFormData.confirmNewPassword}
                  onChange={handlePasswordFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="w-full sm:w-auto bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
                >
                  {changePasswordLoading
                    ? t("changing_password_message")
                    : t("change_password_button")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="w-full sm:w-auto bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition duration-200"
                >
                  {t("cancel_button")}
                </button>
              </div>

              {changePasswordError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm mt-4">
                  {changePasswordError}
                </div>
              )}
              {changePasswordSuccess && (
                <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm mt-4">
                  {t("password_changed_success_message")}
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfilePage;
