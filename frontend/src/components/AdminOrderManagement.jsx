import React, { useEffect, useState, useContext } from "react";
import AdminAuthContext from "../context/AdminAuthContext";
import ConfirmationModal from "./ConfirmationModal";
import { useTranslation } from "react-i18next";

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

  const { t } = useTranslation(); // Initialize translation hook

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
        }`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      if (!res.ok) throw new Error(t("admin_order_management.fetch_failed"));
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
      // We need to send the authorization token with the request
      const token = localStorage.getItem("adminToken"); // Get admin token from local storage
      await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: editingStatus[orderId] }),
      });
      await fetchOrders();
    } catch (err) {
      alert(t("admin_order_management.update_status_failed")); // Translate alert
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
      alert(t("admin_order_management.delete_failed")); // Translate alert
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
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`http://localhost:5000/api/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok)
        throw new Error(t("admin_order_management.fetch_details_failed"));
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
      t("admin_order_management.confirm_delete") // Translate confirmation message
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
            {t("admin_order_management.title")}
          </h2>
        </div>
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div>
            <label className="font-semibold mr-2">
              {t("admin_order_management.filter_status_label")}
            </label>
            <select
              className="border rounded px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">
                {t("admin_order_management.all_statuses_option")}
              </option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {t(
                    `order_status_${status}`,
                    status.charAt(0).toUpperCase() + status.slice(1)
                  )}{" "}
                  {/* Translate status */}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="text-gray-500 text-center">
            {t("admin_order_management.loading")}
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">
            {t("admin_order_management.error", { error: error })}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-gray-500 text-center">
            {t("admin_order_management.no_orders_found")}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-[8%]">
                      {t("admin_order_management.table_header_order_id")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-[15%]">
                      ຊື່
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-[10%]">
                      {t("admin_order_management.table_header_user")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-[12%]">
                      {t("admin_order_management.table_header_status")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-[15%]">
                      {t("admin_order_management.table_header_created")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-[5%]">
                      {t("admin_order_management.table_header_items")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-[10%]">
                      {t("admin_order_management.table_header_total")}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase w-[10%]">
                      {t("admin_order_management.table_header_payment")}
                    </th>
                    <th className="px-4 py-3 w-[15%]"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-green-50 transition">
                      <td className="px-4 py-3 font-mono w-[8%]">
                        #{order.id}
                      </td>
                      <td className="px-4 py-3 w-[15%]">
                        {/* Display customer_name if available, fallback to shipping_name or guest user */}
                        {order.customer_name || order.shipping_name}
                      </td>
                      <td className="px-4 py-3 w-[10%]">
                        {order.username || order.user_id}
                      </td>
                      <td className="px-4 py-3 capitalize font-semibold text-green-700 w-[12%]">
                        <select
                          className="border rounded px-2 py-1 bg-white"
                          value={editingStatus[order.id] ?? order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value)
                          }
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {t(
                                `order_status_${status}`,
                                status.charAt(0).toUpperCase() + status.slice(1)
                              )}{" "}
                              {/* Translate status */}
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
                            ? t("admin_order_management.saving_button")
                            : t("admin_order_management.save_button")}{" "}
                          {/* Translate button text */}
                        </button>
                      </td>
                      <td className="px-4 py-3 w-[15%]">
                        {order.created_at &&
                          new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 w-[5%]">{order.item_count}</td>
                      <td className="px-4 py-3 font-bold text-green-700 w-[10%]">
                        {parseFloat(order.total).toLocaleString("lo-LA", {
                          style: "currency",
                          currency: "LAK",
                        })}
                      </td>
                      <td className="px-4 py-3 capitalize w-[10%]">
                        {order.payment_type
                          ? t(
                              `payment_type_${order.payment_type}`,
                              order.payment_type
                            )
                          : t("admin_order_management.not_specified")}{" "}
                        {/* Translate payment type */}
                      </td>
                      <td className="px-4 py-3 w-[15%]">
                        <button
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center text-sm"
                          onClick={() => openOrderModal(order)}
                        >
                          {t("admin_order_management.view_button")}{" "}
                        </button>
                        <button
                          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition duration-200 shadow text-center text-sm ml-2"
                          onClick={() => confirmDelete(order.id)}
                          disabled={deleting[order.id]}
                        >
                          {deleting[order.id]
                            ? t("admin_order_management.deleting_button")
                            : t("admin_order_management.delete_button")}{" "}
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
              aria-label={t("admin_order_management.close_modal_aria")}
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-4 text-green-700">
              {t("admin_order_management.order_details_title", {
                orderId: modalOrder.id,
              })}
            </h3>
            {modalLoading ? (
              <div className="text-gray-500">
                {t("admin_order_management.loading_details")}
              </div>
            ) : modalError ? (
              <div className="text-red-500">
                {t("admin_order_management.modal_error", { error: modalError })}
              </div>
            ) : modalOrderDetails ? (
              <>
                <div className="mb-2">
                  <span className="font-semibold">ຊື່:</span>{" "}
                  {modalOrderDetails.username ||
                    modalOrderDetails.shipping_name ||
                    t("admin_order_management.not_specified")}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">
                    {t("admin_order_management.detail_status_label")}:
                  </span>{" "}
                  <span className="capitalize">
                    {t(
                      `order_status_${modalOrderDetails.status}`,
                      modalOrderDetails.status.charAt(0).toUpperCase() +
                        modalOrderDetails.status.slice(1)
                    )}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">
                    {t("admin_order_management.detail_payment_type_label")}:
                  </span>{" "}
                  <span className="capitalize">
                    {modalOrderDetails.payment_type
                      ? t(
                          `payment_type_${modalOrderDetails.payment_type}`,
                          modalOrderDetails.payment_type
                        )
                      : t("admin_order_management.not_specified")}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">
                    {t("admin_order_management.detail_created_label")}:
                  </span>{" "}
                  {modalOrderDetails.created_at &&
                    new Date(modalOrderDetails.created_at).toLocaleString()}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">
                    {t("admin_order_management.detail_shipping_label")}:
                  </span>{" "}
                  {modalOrderDetails.shipping_address},{" "}
                  {modalOrderDetails.shipping_phone},{" "}
                  {modalOrderDetails.shipping_email}
                </div>

                <div className="mb-2">
                  <span className="font-semibold">
                    {t("admin_order_management.detail_items_label")}:
                  </span>
                  <ul className="list-disc ml-6 mt-1">
                    {modalOrderDetails.items &&
                    modalOrderDetails.items.length > 0 ? (
                      modalOrderDetails.items.map((item) => (
                        <li key={item.id} className="text-gray-700">
                          {item.name} x {item.quantity}{" "}
                          <span className="font-bold text-green-700 ">
                            (
                            {parseFloat(item.price).toLocaleString("lo-LA", {
                              style: "currency",
                              currency: "LAK",
                            })}{" "}
                            )
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-500">
                        {t("admin_order_management.no_items_found")}
                      </li>
                    )}
                  </ul>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">
                    {t("admin_order_management.detail_total_label")}:
                  </span>{" "}
                  <span className="font-bold text-green-700">
                    {parseFloat(modalOrderDetails.total).toLocaleString(
                      "lo-LA",
                      { style: "currency", currency: "LAK" }
                    )}
                  </span>
                </div>
                {/* Payment Proof Image */}
                <div className="mb-2">
                  <span className="font-semibold">
                    {t("admin_order_management.detail_payment_proof_label")}:
                  </span>
                  {modalOrderDetails.payment_proof ? (
                    <a
                      href={modalOrderDetails.payment_proof}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={modalOrderDetails.payment_proof}
                        alt={t("admin_order_management.payment_proof_alt")}
                        className="w-32 h-32 object-contain rounded-lg border border-green-200 shadow mt-2"
                      />
                    </a>
                  ) : (
                    <span className="text-gray-500 ml-2">
                      {t("admin_order_management.no_image")}
                    </span>
                  )}
                </div>
                {/* Action buttons for view mode */}
                <div className="flex justify-end mt-4 gap-2">
                  <a
                    href={`/invoice/${modalOrderDetails.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow text-center text-sm"
                  >
                    ພິມໃບບິນ
                  </a>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </div>
  );
}

export default AdminOrderManagement;
