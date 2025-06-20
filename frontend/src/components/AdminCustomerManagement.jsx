import React, { useEffect, useState, useContext } from "react";
import AdminAuthContext from "../context/AdminAuthContext";
import ConfirmationModal from "./ConfirmationModal";
import { useTranslation } from "react-i18next";

const STATUS_OPTIONS = ["pending", "paid", "shipped", "completed", "cancelled"];
const USER_STATUS_OPTIONS = ["active", "inactive", "banned"];

function AdminCustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [search, setSearch] = useState("");
  const [modalCustomer, setModalCustomer] = useState(null);
  const [modalOrders, setModalOrders] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [editingStatus, setEditingStatus] = useState({}); // {orderId: status}
  const [updating, setUpdating] = useState({}); // {orderId: true/false}
  const [deleting, setDeleting] = useState({}); // To track deletion status for each customer

  // State for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [actionToConfirm, setActionToConfirm] = useState(null); // Store the action to perform on confirm

  const { adminToken } = useContext(AdminAuthContext);
  const { t } = useTranslation();

  useEffect(() => {
    if (adminToken) {
      // Only fetch if adminToken is available
      fetchCustomers(page);
    }
  }, [page, adminToken]); // Add adminToken to dependency array

  // Fetch customers with pagination and search
  const fetchCustomers = async (pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(
        `${API_URL}/api/admin/users?limit=${pageSize}&offset=${
          (pageNum - 1) * pageSize
        }${search ? `&search=${search}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add a useEffect for search to re-fetch data
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (adminToken) {
        fetchCustomers(1); // Fetch from page 1 when search term changes
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(delayDebounceFn);
  }, [search, adminToken]); // Depend on search term

  // Fetch orders for a customer and open modal
  const openOrdersModal = async (customer) => {
    setModalCustomer(customer);
    setModalOrders([]);
    setModalLoading(true);
    setModalError("");

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/api/orders?user_id=${customer.id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      let data;
      if (res.ok) {
        data = await res.json();
        if (data && Array.isArray(data.orders)) {
          data = data.orders.filter((o) => o.user_id === customer.id);
        } else if (!Array.isArray(data)) {
          data = [];
        }

        if (!data.length || !data[0].user_id) {
          const allRes = await fetch(`${API_URL}/api/orders`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          if (allRes.ok) {
            const allOrders = await allRes.json();
            if (allOrders && Array.isArray(allOrders.orders)) {
              data = allOrders.orders.filter((o) => o.user_id === customer.id);
            } else if (Array.isArray(allOrders)) {
              data = allOrders.filter((o) => o.user_id === customer.id);
            } else {
              data = [];
              console.error("Unexpected data format from /api/orders fallback");
            }
          } else {
            throw new Error("Failed to fetch orders in fallback");
          }
        }
      } else {
        const allRes = await fetch(`${API_URL}/api/orders`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        if (allRes.ok) {
          const allOrders = await allRes.json();
          if (allOrders && Array.isArray(allOrders.orders)) {
            data = allOrders.orders.filter((o) => o.user_id === customer.id);
          } else if (Array.isArray(allOrders)) {
            data = allOrders.filter((o) => o.user_id === customer.id);
          } else {
            data = [];
            console.error("Unexpected data format from /api/orders fallback");
          }
        } else {
          throw new Error("Failed to fetch orders in fallback");
        }
      }

      setModalOrders(data);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Status change logic
  const handleStatusChange = (orderId, value) => {
    setEditingStatus((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleUpdateStatus = async (orderId) => {
    setUpdating((prev) => ({ ...prev, [orderId]: true }));
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: editingStatus[orderId] }),
      });
      // Refresh orders in modal
      if (modalCustomer) await openOrdersModal(modalCustomer);
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Add this handler for user status update
  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      await fetch(`${API_URL}/api/admin/customers/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      setCustomers((prev) =>
        prev.map((c) => (c.id === userId ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  // Pagination controls
  const totalPages = Math.ceil(total / pageSize);
  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  // Handle customer deletion
  const handleDeleteCustomer = async (customerId, token) => {
    if (!customerId || !token) return;
    setDeleting((prev) => ({ ...prev, [customerId]: true }));
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/api/admin/users/${customerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || "Failed to delete customer");
        } catch {
          throw new Error(errorText || "Failed to delete customer");
        }
      }

      setCustomers((prev) =>
        prev.filter((customer) => customer.id !== customerId)
      );

      setIsConfirmModalOpen(false);
      setActionToConfirm(null);
    } catch (err) {
      alert("Failed to delete customer: " + err.message);
      setIsConfirmModalOpen(false);
      setActionToConfirm(null);
    } finally {
      setDeleting((prev) => ({ ...prev, [customerId]: false }));
    }
  };

  // Function to trigger confirmation modal for delete
  const confirmDelete = (customerId) => {
    const currentAdminToken = adminToken;
    setConfirmMessage(t("customerManagement.confirmDelete"));
    setActionToConfirm(
      () => () => handleDeleteCustomer(customerId, currentAdminToken)
    );
    setIsConfirmModalOpen(true);
  };

  // Function to handle confirmation action
  const handleConfirm = () => {
    if (actionToConfirm) {
      actionToConfirm();
    }
  };

  // Function to handle cancellation
  const handleCancelConfirm = () => {
    setIsConfirmModalOpen(false);
    setActionToConfirm(null);
  };

  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center bg-gradient-to-br from-green-50 to-white py-12 px-2">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl p-8 border border-green-100">
        <h2 className="text-3xl font-extrabold text-green-700 mb-8 text-center">
          {t("customerManagement.title")}
        </h2>
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <input
            type="text"
            className="border rounded px-3 py-2 w-full md:w-80"
            placeholder={t("customerManagement.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="text-gray-500 text-center">
            {t("customerManagement.loadingCustomers")}
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">
            {t("customerManagement.error", { error: error })}
          </div>
        ) : customers.length === 0 ? (
          <div className="text-gray-500 text-center">
            {t("customerManagement.noCustomersFound")}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("customerManagement.Name")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("customerManagement.Username")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("customer_phone_label")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("customerManagement.Email")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("customerManagement.Registered")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("customerManagement.Status")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("customerManagement.Orders")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("customerManagement.TotalSpent")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      {t("customerManagement.Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-green-50 transition">
                      <td className="px-4 py-3 font-mono">{c.id}</td>
                      <td className="px-4 py-3">{c.customer_name || "-"}</td>
                      <td className="px-4 py-3">{c.username}</td>
                      <td className="px-4 py-3">{c.phone}</td>
                      <td className="px-4 py-3">{c.email}</td>
                      <td className="px-4 py-3">
                        {c.created_at &&
                          new Date(c.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize font-semibold text-green-700">
                          {c.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.total_orders !== undefined ? c.total_orders : "N/A"}
                      </td>
                      <td className="px-4 py-3 font-bold text-green-700">
                        {c.total_spent !== undefined
                          ? parseFloat(c.total_spent).toLocaleString("lo-LA", {
                              style: "currency",
                              currency: "LAK",
                            })
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 flex items-center">
                        <button
                          className="w-20 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center text-sm mr-2"
                          onClick={() => openOrdersModal(c)}
                        >
                          {t("view_details_button")}
                        </button>
                        <button
                          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition duration-200 shadow text-center text-sm"
                          onClick={() => confirmDelete(c.id)}
                          disabled={deleting[c.id]}
                        >
                          {deleting[c.id]
                            ? t("deleting_button")
                            : t("delete_button")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
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
          </>
        )}
      </div>
      {/* Orders Modal */}
      {modalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-3xl w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold"
              onClick={() => setModalCustomer(null)}
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-4 text-green-700">
              {t("customerManagement.ordersFor", {
                username: modalCustomer.username,
              })}
            </h3>
            {modalLoading ? (
              <div className="text-gray-500">
                {t("customerManagement.loadingOrdersModal")}
              </div>
            ) : modalError ? (
              <div className="text-red-500">
                {t("customerManagement.errorLoadingOrdersModal", {
                  error: modalError,
                })}
              </div>
            ) : modalOrders.length === 0 ? (
              <div className="text-gray-500">
                {t("customerManagement.noOrdersFoundForCustomer")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        {t("customerManagement.Id")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        {t("customerManagement.status")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        {t("customerManagement.created")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        {t("customerManagement.items")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        {t("customerManagement.total")}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        {t("customerManagement.payment")}
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {modalOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-green-50 transition"
                      >
                        <td className="px-4 py-3 font-mono">#{order.id}</td>
                        <td className="px-4 py-3 capitalize font-semibold text-green-700">
                          <select
                            className="border rounded px-2 py-1 bg-white"
                            value={editingStatus[order.id] ?? order.status}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value)
                            }
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {t(`order_status_${status}`)}
                              </option>
                            ))}
                          </select>
                          <button
                            className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs font-semibold disabled:opacity-60"
                            onClick={() => handleUpdateStatus(order.id)}
                            disabled={
                              updating[order.id] ||
                              (editingStatus[order.id] ?? order.status) ===
                                order.status
                            }
                          >
                            {updating[order.id]
                              ? t("saving_button")
                              : t("save_button")}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {order.created_at &&
                            new Date(order.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">{order.item_count}</td>
                        <td className="px-4 py-3 font-bold text-green-700">
                          {parseFloat(order.total).toLocaleString("lo-LA", {
                            style: "currency",
                            currency: "LAK",
                          })}
                        </td>
                        <td className="px-4 py-3 capitalize">
                          {order.payment_type
                            ? t(`payment_type_${order.payment_type}`)
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {/* Optionally, add a View Details button here for a nested modal */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      <ConfirmationModal
        message={confirmMessage}
        isOpen={isConfirmModalOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </div>
  );
}

export default AdminCustomerManagement;
