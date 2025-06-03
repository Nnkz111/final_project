import React, { useEffect, useState, useContext } from "react";
import AdminAuthContext from "../context/AdminAuthContext";
import ConfirmationModal from "./ConfirmationModal"; // Assuming you have a ConfirmationModal component
import { useTranslation } from "react-i18next";

const USER_STATUS_OPTIONS = ["active", "inactive", "banned"]; // Define possible user statuses

function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10; // Number of users per page
  const [search, setSearch] = useState("");

  // State for edit modal/form
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // User data being edited
  const [editFormData, setEditFormData] = useState({}); // Data for the edit form
  const [saving, setSaving] = useState(false); // To track saving state

  // State for confirmation modal (for delete)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [actionToConfirm, setActionToConfirm] = useState(null); // Store the user ID to delete

  const { adminToken } = useContext(AdminAuthContext);
  const { t } = useTranslation();

  useEffect(() => {
    fetchUsers(page);
  }, [page]); // Refetch users when the page changes

  // Fetch users with pagination (without search parameter in fetch)
  const fetchUsers = async (pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      // Using the existing /api/admin/customers endpoint as it returns user details
      // Remove the search parameter from the fetch call
      const res = await fetch(
        `http://localhost:5000/api/admin/customers?limit=${pageSize}&offset=${
          (pageNum - 1) * pageSize
        }`,
        {
          headers: {
            // Assuming admin endpoints require token
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      // The /api/admin/customers endpoint returns 'customers', but it contains user data
      setUsers(data.customers); // Set the users state with the fetched data
      setTotal(data.total); // Keep the total count from the backend for pagination
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Handle search submission (no longer needed for client-side filter, but keep to prevent form submission)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Client-side filtering happens automatically when 'search' state changes
  };

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Open Edit Modal
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditFormData({
      // Initialize form data with current user data
      username: user.username,
      email: user.email,
      status: user.status,
      is_admin: user.is_admin, // Include is_admin status
    });
    setIsEditModalOpen(true);
  };

  // Close Edit Modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditFormData({});
  };

  // Handle form data changes in Edit Modal
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle Save Changes in Edit Modal
  const handleSaveChanges = async () => {
    if (!editingUser || saving) return; // Prevent multiple clicks

    setSaving(true);
    setError(""); // Clear previous errors

    try {
      // ** This is where we'd use the new backend endpoint **
      // Since we don't have it yet, this call will likely fail or do nothing as expected
      const res = await fetch(
        `http://localhost:5000/api/admin/users/${editingUser.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(editFormData), // Send updated data
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update user");
      }

      // Close modal and refresh user list
      closeEditModal();
      fetchUsers(page); // Refresh the current page
    } catch (err) {
      setError(err.message);
      alert(`Error saving user: ${err.message}`); // Show error to the user
    } finally {
      setSaving(false);
    }
  };

  // Open Confirmation Modal for Delete
  const confirmDelete = (user) => {
    setConfirmMessage(`${t("delete_user_confirmation")} "${user.username}"?`);
    setActionToConfirm(() => () => handleDeleteUser(user.id)); // Store delete action
    setIsConfirmModalOpen(true);
  };

  // Handle Delete User
  const handleDeleteUser = async (userId) => {
    if (!adminToken) return; // Ensure admin is logged in

    setLoading(true); // Show loading state
    setError(""); // Clear previous errors

    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      // Refresh user list after deletion
      fetchUsers(page); // Refresh the current page
    } catch (err) {
      setError(err.message);
      alert(`Error deleting user: ${err.message}`); // Show error to the user
    } finally {
      setLoading(false);
      setIsConfirmModalOpen(false); // Close confirmation modal
      setActionToConfirm(null); // Clear action
    }
  };

  // Handle confirmation modal actions
  const handleConfirm = () => {
    if (actionToConfirm) {
      actionToConfirm(); // Execute the stored action (delete)
    }
  };

  // Handle cancel confirmation modal
  const handleCancelConfirm = () => {
    setIsConfirmModalOpen(false);
    setActionToConfirm(null);
  };

  // Pagination controls
  const totalPages = Math.ceil(total / pageSize);
  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center bg-gradient-to-br from-green-50 to-white py-12 px-2">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl p-8 border border-green-100">
        <h2 className="text-3xl font-extrabold text-green-700 mb-8 text-center">
          {t("admin_user_management.title")}
        </h2>

        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="mb-6 flex flex-col md:flex-row md:items-center gap-4"
        >
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={handleSearchChange}
            className="border rounded px-3 py-2 w-full md:w-80"
          />
        </form>

        {loading ? (
          <div className="text-gray-500 text-center">Loading users...</div>
        ) : error ? (
          <div className="text-red-500 text-center">Error: {error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-gray-500 text-center">No users found.</div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    {t("admin_user_management.username")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    {t("admin_user_management.email")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Admin
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    {t("admin_user_management.registered")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    {t("admin_user_management.status")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    {t("admin_user_management.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-green-50 transition">
                    <td className="px-4 py-3 font-mono">{user.username}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">
                      {user.is_admin ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(user.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 capitalize font-semibold text-green-700">
                      {user.status || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(user)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center text-sm mr-2"
                      >
                        {t("edit_button")}
                      </button>
                      {/* Delete Button */}
                      {/* Prevent deleting oneself if admin */}
                      {adminToken &&
                        JSON.parse(atob(adminToken.split(".")[1])).userId !==
                          user.id && (
                          <button
                            onClick={() => confirmDelete(user)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition duration-200 shadow text-center text-sm"
                          >
                            {t("delete_button")}
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={handlePrev}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="font-semibold text-green-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={handleNext}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Edit User Modal */}
        {isEditModalOpen && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold"
                onClick={closeEditModal}
              >
                &times;
              </button>
              <h3 className="text-2xl font-bold mb-4 text-green-700">
                Edit User
              </h3>
              <form>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="username"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={editFormData.username || ""}
                    onChange={handleEditFormChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editFormData.email || ""}
                    onChange={handleEditFormChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                {/* Add status selection */}
                <div className="mb-4">
                  <label
                    className="block text-gray-700 text-sm font-bold mb-2"
                    htmlFor="status"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={editFormData.status || ""}
                    onChange={handleEditFormChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="">Select Status</option>
                    {USER_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Add is_admin checkbox */}
                <div className="mb-4 flex items-center">
                  <input
                    type="checkbox"
                    id="is_admin"
                    name="is_admin"
                    checked={editFormData.is_admin || false}
                    onChange={handleEditFormChange}
                    className="mr-2 leading-tight"
                  />
                  <label className="text-sm text-gray-700" htmlFor="is_admin">
                    Is Admin
                  </label>
                </div>
                <div className="flex items-center justify-end gap-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal (for Delete) */}
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          message={confirmMessage}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
        />
      </div>
    </div>
  );
}

export default AdminUserManagement;
