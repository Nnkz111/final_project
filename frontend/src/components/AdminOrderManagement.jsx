import React, { useEffect, useState, useContext } from "react";
import AdminAuthContext from "../context/AdminAuthContext";
import ConfirmationModal from "./ConfirmationModal";

const STATUS_OPTIONS = ["pending", "paid", "shipped", "completed", "cancelled"];

function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingStatus, setEditingStatus] = useState({}); // {orderId: status}
  const [updating, setUpdating] = useState({}); // {orderId: true/false}
  const [modalOrder, setModalOrder] = useState(null);
  const [modalOrderDetails, setModalOrderDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deleting, setDeleting] = useState({}); // {orderId: true/false}
  const { adminToken } = useContext(AdminAuthContext);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // State for confirmation modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [actionToConfirm, setActionToConfirm] = useState(null); // Store the action to perform on confirm

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  const fetchOrders = async (pageNum = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `http://localhost:5000/api/orders?limit=${pageSize}&offset=${
          (pageNum - 1) * pageSize
        }`
      );
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (orderId, value) => {
    setEditingStatus((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleUpdateStatus = async (orderId) => {
    setUpdating((prev) => ({ ...prev, [orderId]: true }));
    try {
      await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editingStatus[orderId] }),
      });
      await fetchOrders();
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!orderId) return;
    setDeleting((prev) => ({ ...prev, [orderId]: true }));
    try {
      await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      });
      await fetchOrders();
      setIsConfirmModalOpen(false);
      setActionToConfirm(null);
    } catch (err) {
      alert("Failed to delete order");
      setIsConfirmModalOpen(false);
      setActionToConfirm(null);
    } finally {
      setDeleting((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const filteredOrders = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  // Fetch full order details for modal
  const openOrderModal = async (order) => {
    setModalOrder(order);
    setModalOrderDetails(null);
    setModalLoading(true);
    setModalError("");
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${order.id}`);
      if (!res.ok) throw new Error("Failed to fetch order details");
      const data = await res.json();
      setModalOrderDetails(data);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Pagination controls
  const totalPages = Math.ceil(total / pageSize);
  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  // Function to trigger confirmation modal for delete
  const confirmDelete = (orderId) => {
    setConfirmMessage(
      "Are you sure you want to delete this order? This cannot be undone."
    );
    setActionToConfirm(() => () => handleDeleteOrder(orderId));
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
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-8 border border-green-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-extrabold text-green-700 mb-4 text-center">
            Order Management
          </h2>
        </div>
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div>
            <label className="font-semibold mr-2">Filter by Status:</label>
            <select
              className="border rounded px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="text-gray-500 text-center">Loading orders...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-gray-500 text-center">No orders found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Items
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                      Payment
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-green-50 transition">
                      <td className="px-4 py-3 font-mono">#{order.id}</td>
                      <td className="px-4 py-3">
                        {order.username || order.user_id}
                      </td>
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
                              {status.charAt(0).toUpperCase() + status.slice(1)}
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
                          {updating[order.id] ? "Saving..." : "Save"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {order.created_at &&
                          new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{order.item_count}</td>
                      <td className="px-4 py-3 font-bold text-green-700">
                        ${parseFloat(order.total).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {order.payment_type || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center text-sm"
                          onClick={() => openOrderModal(order)}
                        >
                          View
                        </button>
                        <button
                          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition duration-200 shadow text-center text-sm ml-2"
                          onClick={() => confirmDelete(order.id)}
                          disabled={deleting[order.id]}
                        >
                          {deleting[order.id] ? "Deleting..." : "Delete"}
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
      {/* Order Detail Modal */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl font-bold"
              onClick={() => setModalOrder(null)}
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-4 text-green-700">
              Order #{modalOrder.id}
            </h3>
            {modalLoading ? (
              <div className="text-gray-500">Loading details...</div>
            ) : modalError ? (
              <div className="text-red-500">{modalError}</div>
            ) : modalOrderDetails ? (
              <>
                <div className="mb-2">
                  <span className="font-semibold">User:</span>{" "}
                  {modalOrderDetails.username ||
                    modalOrderDetails.shipping_name ||
                    "-"}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Status:</span>{" "}
                  <span className="capitalize">{modalOrderDetails.status}</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Payment Type:</span>{" "}
                  <span className="capitalize">
                    {modalOrderDetails.payment_type || "-"}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Created:</span>{" "}
                  {modalOrderDetails.created_at &&
                    new Date(modalOrderDetails.created_at).toLocaleString()}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Shipping:</span>{" "}
                  {modalOrderDetails.shipping_name},{" "}
                  {modalOrderDetails.shipping_address},{" "}
                  {modalOrderDetails.shipping_phone},{" "}
                  {modalOrderDetails.shipping_email}
                </div>

                <div className="mb-2">
                  <span className="font-semibold">Items:</span>
                  <ul className="list-disc ml-6 mt-1">
                    {modalOrderDetails.items &&
                    modalOrderDetails.items.length > 0 ? (
                      modalOrderDetails.items.map((item) => (
                        <li key={item.id} className="text-gray-700">
                          {item.name} x {item.quantity}{" "}
                          <span className="text-gray-500">
                            (${parseFloat(item.price).toFixed(2)})
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">No items</li>
                    )}
                  </ul>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Total:</span>{" "}
                  <span className="font-bold text-green-700">
                    {modalOrderDetails.total &&
                    !isNaN(parseFloat(modalOrderDetails.total))
                      ? `$${parseFloat(modalOrderDetails.total).toFixed(2)}`
                      : "-"}
                  </span>
                </div>
                {/* Payment Proof Image */}
                <div className="mb-2">
                  <span className="font-semibold">Payment Proof:</span>
                  {modalOrderDetails.payment_proof ? (
                    <a
                      href={`http://localhost:5000${modalOrderDetails.payment_proof}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={`http://localhost:5000${modalOrderDetails.payment_proof}`}
                        alt="Payment Proof"
                        className="w-32 h-32 object-contain rounded-lg border border-green-200 shadow mt-2"
                      />
                    </a>
                  ) : (
                    <span className="text-gray-500 ml-2">(No Image)</span>
                  )}
                </div>
              </>
            ) : null}
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

export default AdminOrderManagement;
