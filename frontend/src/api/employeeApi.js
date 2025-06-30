import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const EMPLOYEE_URL = `${API_URL}/api/employees`;

export const getEmployees = async () => {
  const res = await axios.get(EMPLOYEE_URL);
  return Array.isArray(res.data) ? res.data : [];
};

export const addEmployee = async (employee) => {
  const res = await axios.post(EMPLOYEE_URL, employee);
  return res.data;
};

export const editEmployee = async (id, employee) => {
  const res = await axios.put(`${EMPLOYEE_URL}/${id}`, employee);
  return res.data;
};

export const deleteEmployee = async (id) => {
  const res = await axios.delete(`${EMPLOYEE_URL}/${id}`);
  return res.data;
};
