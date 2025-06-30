import React, { useEffect, useState } from "react";
import {
  getEmployees,
  addEmployee,
  editEmployee,
  deleteEmployee,
} from "../api/employeeApi";

function AdminEmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    role: "staff",
  });
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError("Failed to load employees");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openModal = (emp = null) => {
    if (emp) {
      setForm({
        username: emp.username || "",
        password: "",
        name: emp.name,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
      });
      setEditId(emp.id);
    } else {
      setForm({
        username: "",
        password: "",
        name: "",
        email: "",
        phone: "",
        role: "staff",
      });
      setEditId(null);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm({
      username: "",
      password: "",
      name: "",
      email: "",
      phone: "",
      role: "staff",
    });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await editEmployee(editId, form);
      } else {
        await addEmployee(form);
      }
      closeModal();
      fetchEmployees();
    } catch (err) {
      setError("Failed to save employee");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this employee?")) return;
    try {
      await deleteEmployee(id);
      fetchEmployees();
    } catch (err) {
      setError("Failed to delete employee");
    }
  };

  // Filter employees by id or name
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.employee_code?.toString().includes(search.trim()) ||
      emp.name?.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ຈັດການຂໍ້ມູນພະນັກງານ</h1>
      <button
        onClick={() => openModal()}
        className="mb-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        + ເພີ່ມພະນັກງານ
      </button>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by ID or Name"
        className="mb-4 ml-4 border px-2 py-1 rounded"
        style={{ minWidth: 200 }}
      />
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">
              {editId ? "Edit" : "Add"} Employee
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Username"
                className="border px-2 py-1 w-full"
                autoComplete="off"
                required
              />
              {!editId && (
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="border px-2 py-1 w-full"
                  autoComplete="off"
                  required
                />
              )}
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Name"
                className="border px-2 py-1 w-full"
                required
              />
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                className="border px-2 py-1 w-full"
                required
              />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="border px-2 py-1 w-full"
                required
              />
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="border px-2 py-1 w-full"
              >
                <option value="staff">ພະນັກງານ</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded w-full"
                >
                  {editId ? "Update" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded w-full"
                >
                  ຍົກເລິກ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border px-4 py-2">ລຳດັບ</th>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">ຊື່ຜູ້ໃຊ້</th>
              <th className="border px-4 py-2">ຊື່</th>
              <th className="border px-4 py-2">ອີເມວ</th>
              <th className="border px-4 py-2">ເບີໂທ</th>
              <th className="border px-4 py-2">ຕຳແໜ່ງ</th>
              <th className="border px-4 py-2">ການຈັດການ</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp, idx) => (
              <tr key={emp.id}>
                <td className="border px-4 py-2">{idx + 1}</td>
                <td className="border px-4 py-2">{emp.employee_code}</td>
                <td className="border px-4 py-2">{emp.username}</td>
                <td className="border px-4 py-2">{emp.name}</td>
                <td className="border px-4 py-2">{emp.email}</td>
                <td className="border px-4 py-2">{emp.phone}</td>
                <td className="border px-4 py-2">{emp.role}</td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => openModal(emp)}
                    className="bg-yellow-400 px-2 py-1 rounded mr-2"
                  >
                    ແກ້ໄຂ
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    ລຶບ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminEmployeeManagement;
