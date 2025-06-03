import React, { useContext, useState, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

function UserProfilePage() {
  const { user, updateUser } = useContext(AuthContext);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    name: user?.customer?.name || "",
    phone: user?.customer?.phone || "",
    address: user?.customer?.address || "",
  });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [editProfileLoading, setEditProfileLoading] = useState(false);
  const [editProfileError, setEditProfileError] = useState(null);
  const [editProfileSuccess, setEditProfileSuccess] = useState(false);
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
        const response = await fetch("http://localhost:5000/api/profile", {
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
    setEditProfileLoading(true);
    setEditProfileError(null);
    setEditProfileSuccess(false);
    console.log("Submitting profile changes...", profileFormData);
    try {
      const response = await fetch("http://localhost:5000/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("customerToken")}`,
        },
        body: JSON.stringify(profileFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedUser = await response.json();
      setEditProfileSuccess(true);
      setIsEditingProfile(false);
      updateUser(updatedUser);
    } catch (err) {
      setEditProfileError(err.message);
    } finally {
      setEditProfileLoading(false);
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
    console.log("Submitting password change...");

    try {
      const response = await fetch(
        "http://localhost:5000/api/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("customerToken")}`,
          },
          body: JSON.stringify({
            currentPassword: passwordFormData.currentPassword,
            newPassword: passwordFormData.newPassword,
          }),
        }
      );

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
    <div className="w-full py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {t("user_profile_title")}
        </h1>
        <div className="space-y-3">
          <p>
            <strong>{t("username_label")}:</strong> {profileFormData.username}
          </p>
          <p>
            <strong>{t("email_label")}:</strong> {profileFormData.email}
          </p>
          {profileFormData.name && profileFormData.name !== "" && (
            <p>
              <strong>{t("name_label")}:</strong> {profileFormData.name}
            </p>
          )}
          {profileFormData.phone && profileFormData.phone !== "" && (
            <p>
              <strong>{t("phone_label")}:</strong> {profileFormData.phone}
            </p>
          )}
          {profileFormData.address && profileFormData.address !== "" && (
            <p>
              <strong>{t("address_label")}:</strong> {profileFormData.address}
            </p>
          )}
        </div>
        <div className="mt-6 space-x-4">
          {!isEditingProfile && !isChangingPassword && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              {t("edit_profile_button")}
            </button>
          )}
          {!isEditingProfile && !isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
            >
              {t("change_password_button")}
            </button>
          )}
        </div>

        {isEditingProfile && (
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
            <h2 className="text-xl font-bold mb-4">
              {t("edit_profile_title")}
            </h2>
            <form onSubmit={handleSubmitProfile}>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="username"
                >
                  {t("username_label")}:
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={profileFormData.username}
                  onChange={handleProfileFormChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="email"
                >
                  Email:
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileFormData.email}
                  onChange={handleProfileFormChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="name"
                >
                  Name:
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileFormData.name}
                  onChange={handleProfileFormChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="phone"
                >
                  {t("phone_number_label")}:
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profileFormData.phone}
                  onChange={handleProfileFormChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="address"
                >
                  Address:
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={profileFormData.address}
                  onChange={handleProfileFormChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {t("save_changes_button")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                >
                  {t("cancel_button")}
                </button>
              </div>
              {editProfileLoading && <p>{t("saving_changes_message")}</p>}
              {editProfileError && (
                <p className="text-red-500">
                  {t("error_prefix")}: {editProfileError}
                </p>
              )}
              {editProfileSuccess && (
                <p className="text-green-500">
                  {t("profile_updated_success_message")}
                </p>
              )}
            </form>
          </div>
        )}

        {isChangingPassword && (
          <div className="mt-6 p-4 border rounded-md bg-gray-50">
            <h2 className="text-xl font-bold mb-4">
              {t("change_password_title")}
            </h2>
            <form onSubmit={handleSubmitPasswordChange}>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="current-password"
                >
                  {t("current_password_label")}:
                </label>
                <input
                  type="password"
                  id="current-password"
                  name="currentPassword"
                  value={passwordFormData.currentPassword}
                  onChange={handlePasswordFormChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="new-password"
                >
                  {t("new_password_label")}:
                </label>
                <input
                  type="password"
                  id="new-password"
                  name="newPassword"
                  value={passwordFormData.newPassword}
                  onChange={handlePasswordFormChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="confirm-new-password"
                >
                  {t("confirm_new_password_label")}:
                </label>
                <input
                  type="password"
                  id="confirm-new-password"
                  name="confirmNewPassword"
                  value={passwordFormData.confirmNewPassword}
                  onChange={handlePasswordFormChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                  {t("change_password_button")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(false)}
                  className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                >
                  {t("cancel_button")}
                </button>
              </div>
              {changePasswordLoading && <p>{t("changing_password_message")}</p>}
              {changePasswordError && (
                <p className="text-red-500">{t("new_passwords_match_error")}</p>
              )}
              {changePasswordSuccess && (
                <p className="text-green-500">
                  {t("password_changed_success_message")}
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserProfilePage;
