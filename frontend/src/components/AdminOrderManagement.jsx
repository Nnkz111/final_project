import React, { useEffect, useState, useContext } from "react";
import AdminAuthContext from "../context/AdminAuthContext";
import ConfirmationModal from "./ConfirmationModal";
import { useTranslation } from "react-i18next";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "paid",
  "shipped",
  "completed",
  "cancelled",
];

function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // Default to 'all'
  const [searchQuery, setSearchQuery] = useState(""); // New state for search query
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
    fetchOrders(page, searchQuery, statusFilter);
  }, [page, searchQuery, statusFilter]);

  const fetchOrders = async (pageNum = 1, query = "", status = "all") => {
    setLoading(true);
    setError("");
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      let url = `${API_URL}/api/orders?limit=${pageSize}&offset=${
        (pageNum - 1) * pageSize
      }`;

      if (query) {
        url += `&search=${encodeURIComponent(query)}`;
      }
      if (status !== "all") {
        url += `&status=${encodeURIComponent(status)}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
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
      const token = localStorage.getItem("adminToken");
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: editingStatus[orderId] }),
      });
      await fetchOrders(page, searchQuery, statusFilter);
    } catch (err) {
      alert(t("admin_order_management.update_status_failed")); // Translate alert
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!adminToken) return;
    setDeleting((prev) => ({ ...prev, [orderId]: true }));
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/api/orders/delete/${orderId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!res.ok) throw new Error(t("admin_order_management.delete_failed"));
      await fetchOrders(page, searchQuery, statusFilter);
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

  const filteredOrders =
    statusFilter === "all"
      ? orders // If filter is 'all', show all orders (backend should handle returning all)
      : orders.filter((o) => o.status === statusFilter);

  // Fetch full order details for modal
  const openOrderModal = async (order) => {
    setModalOrder(order);
    setModalOrderDetails(null);
    setModalLoading(true);
    setModalError("");

    try {
      const token = localStorage.getItem("adminToken");
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/api/orders/${order.id}`, {
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

  // State variables for shipping bill upload
  const [selectedShippingBill, setSelectedShippingBill] = useState(null);
  const [uploadingShippingBill, setUploadingShippingBill] = useState(false);

  const handleShippingBillFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedShippingBill(file);
    }
  };

  const handleUploadShippingBill = async () => {
    if (!selectedShippingBill) return;
    setUploadingShippingBill(true);
    try {
      const formData = new FormData();
      formData.append("shipping_bill", selectedShippingBill);
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(
        `${API_URL}/api/orders/${modalOrderDetails.id}/shipping-bill-upload`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: formData,
        }
      );
      if (!res.ok) throw new Error("ຜິດພາດ");
      await fetchOrders(page, searchQuery, statusFilter);
      // Refresh the modal details after successful upload
      if (modalOrder) {
        await openOrderModal(modalOrder);
      }
      setSelectedShippingBill(null);
      setUploadingShippingBill(false);
    } catch (err) {
      alert("ຜິດພາດ");
      setSelectedShippingBill(null);
      setUploadingShippingBill(false);
    }
  };

  const handleRemoveShippingBill = async (orderId) => {
    if (!adminToken) return;
    try {
      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(
        `${API_URL}/api/orders/${orderId}/shipping-bill`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
      if (!res.ok) {
        const errorText = await res.text();
        console.error(
          `Failed to remove shipping bill: ${res.status} - ${errorText}`
        );
        throw new Error("Failed to remove shipping bill");
      }
      await fetchOrders(page, searchQuery, statusFilter); // Refresh orders to reflect the change
      setModalOrderDetails((prev) => ({ ...prev, shipping_bill_url: null })); // Clear the URL in modal state
      setIsConfirmModalOpen(false);
      setActionToConfirm(null);
      alert("Shipping bill removed successfully!");
    } catch (err) {
      console.error("Error removing shipping bill:", err);
      alert("Failed to remove shipping bill.");
      setIsConfirmModalOpen(false);
      setActionToConfirm(null);
    }
  };

  return (
    <div className="min-h-[70vh] w-full flex flex-col items-center bg-gradient-to-br from-green-50 to-white py-12 px-2">
      <div className="w-full max-w-7xl bg-white rounded-3xl shadow-2xl p-8 border border-green-100">
        <h2 className="text-3xl font-extrabold text-green-700 mb-8 text-center">
          {t("admin_order_management.title")}
        </h2>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="statusFilter" className="text-gray-700 font-medium">
              {t("admin_order_management.filter_status_label")}
            </label>
            <select
              id="statusFilter"
              className="mt-1 block w-full md:w-auto rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {t(
                    status === "all"
                      ? "admin_order_management.all_statuses_option"
                      : `order_status_${status}`
                  )}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="ຄົ້ນຫາ"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // Reset to first page on live search
              }}
              className="mt-1 block w-full md:w-auto rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">
            {t("admin_order_management.loading")}
          </div>
        ) : error ? (
          <div className="text-center text-red-500">
            {t("admin_order_management.error", { error: error })}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center text-gray-500">
            {t("admin_order_management.no_orders_found")}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ລຳດັບ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin_order_management.table_header_order_id")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin_order_management.table_header_user")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin_order_management.table_header_status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin_order_management.table_header_created")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin_order_management.table_header_items")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin_order_management.table_header_total")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin_order_management.table_header_payment")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ການຈັດການ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order, index) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.username || t("admin_order_management.guest_user")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={editingStatus[order.id] || order.status}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 ${
                          editingStatus[order.id] &&
                          editingStatus[order.id] !== order.status
                            ? "bg-yellow-100 border-yellow-400"
                            : ""
                        }`}
                      >
                        {STATUS_OPTIONS.slice(1).map(
                          (
                            status // Exclude 'all' from status options for individual order
                          ) => (
                            <option key={status} value={status}>
                              {t(`order_status_${status}`)}
                            </option>
                          )
                        )}
                      </select>
                      <button
                        onClick={() => handleUpdateStatus(order.id)}
                        disabled={
                          updating[order.id] ||
                          (editingStatus[order.id] || order.status) ===
                            order.status
                        }
                        className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {updating[order.id]
                          ? t("admin_order_management.saving_button")
                          : t("admin_order_management.save_button")}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(order.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.item_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                      {parseFloat(order.total || 0).toLocaleString("lo-LA", {
                        style: "currency",
                        currency: "LAK",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">
                      {order.payment_type
                        ? t(`payment_type_${order.payment_type}`)
                        : t("admin_order_management.not_specified")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openOrderModal(order)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center text-sm"
                      >
                        {t("admin_order_management.view_button")}
                      </button>
                      <button
                        onClick={() => confirmDelete(order.id)}
                        disabled={deleting[order.id]}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition duration-200 shadow text-center text-sm ml-2"
                      >
                        {deleting[order.id]
                          ? t("admin_order_management.deleting_button")
                          : t("admin_order_management.delete_button")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for order details */}
        {modalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full relative max-h-[80vh] overflow-y-auto">
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
                  {t("admin_order_management.modal_error", {
                    error: modalError,
                  })}
                </div>
              ) : modalOrderDetails ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
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
                          {t(
                            "admin_order_management.detail_payment_type_label"
                          )}
                          :
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
                          new Date(
                            modalOrderDetails.created_at
                          ).toLocaleString()}
                      </div>
                      <div className="mb-2">
                        <span className="font-semibold">
                          {t("admin_order_management.detail_shipping_label")}:
                        </span>{" "}
                        {modalOrderDetails.shipping_address},{" "}
                        {modalOrderDetails.shipping_phone},{" "}
                        {modalOrderDetails.shipping_email}
                      </div>
                    </div>
                    <div>
                      {/* Payment Proof Image */}
                      <div className="mb-2">
                        <span className="font-semibold">
                          {t(
                            "admin_order_management.detail_payment_proof_label"
                          )}
                          :
                        </span>
                        {modalOrderDetails.payment_proof ? (
                          <a
                            href={modalOrderDetails.payment_proof}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={modalOrderDetails.payment_proof}
                              alt={t(
                                "admin_order_management.payment_proof_alt"
                              )}
                              className="w-32 h-32 object-contain rounded-lg border border-green-200 shadow mt-2"
                            />
                          </a>
                        ) : (
                          <span className="text-gray-500 ml-2">
                            {t("admin_order_management.no_image")}
                          </span>
                        )}
                      </div>
                      {/* COD Down Payment Image */}
                      {modalOrderDetails.payment_type === "cod" && (
                        <div className="mb-2">
                          <span className="font-semibold">ຫຼັກຖານມັດຈຳ :</span>
                          {modalOrderDetails.cod_down_payment_url ? (
                            <a
                              href={modalOrderDetails.cod_down_payment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={modalOrderDetails.cod_down_payment_url}
                                alt="Down Payment"
                                className="w-32 h-32 object-contain rounded-lg border border-green-200 shadow mt-2"
                              />
                            </a>
                          ) : (
                            <span className="text-gray-500 ml-2">
                              ບໍ່ມີຮູບຫຼັກຖານມັດຈຳ
                            </span>
                          )}
                        </div>
                      )}
                      {/* COD ID Card Image */}
                      {modalOrderDetails.payment_type === "cod" && (
                        <div className="mb-2">
                          <span className="font-semibold">ບັດປະຈຳຕົວ :</span>
                          {modalOrderDetails.id_card_img ? (
                            <a
                              href={modalOrderDetails.id_card_img}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={modalOrderDetails.id_card_img}
                                alt="ID Card"
                                className="w-32 h-32 object-contain rounded-lg border border-green-200 shadow mt-2"
                              />
                            </a>
                          ) : (
                            <span className="text-gray-500 ml-2">
                              ບໍ່ມີຮູບບັດປະຈຳຕົວ
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Items and Total */}
                  <div className="mb-2 mt-4">
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

                  {/* Shipping Bill Upload Section */}
                  <div className="mb-4 pt-4 border-t border-gray-200 mt-4">
                    <h4 className="text-lg font-bold mb-2">
                      ອັບໂຫຼດບິນຝາກເຄື່ອງ
                    </h4>
                    {modalOrderDetails.shipping_bill_url ? (
                      <div className="flex items-center gap-2">
                        <p className="text-gray-700"> </p>
                        <a
                          href={modalOrderDetails.shipping_bill_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          ບິນຝາກເຄື່ອງ{" "}
                        </a>
                        <button
                          onClick={() => {
                            setConfirmMessage("ທ່ານຕ້ອງການລົບຮູບພາບນີ້?");
                            setActionToConfirm(
                              () => () =>
                                handleRemoveShippingBill(modalOrderDetails.id)
                            );
                            setIsConfirmModalOpen(true);
                          }}
                          className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600"
                        >
                          ລົບຮູບພາບ
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleShippingBillFileChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                        <button
                          onClick={handleUploadShippingBill}
                          disabled={
                            !selectedShippingBill || uploadingShippingBill
                          }
                          className="bg-green-600 w-32 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition duration-200 shadow text-center text-sm disabled:opacity-50"
                        >
                          {uploadingShippingBill ? "ອັບໂຫຼດ" : "ອັບໂຫຼດ"}
                        </button>
                      </div>
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
      </div>
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
