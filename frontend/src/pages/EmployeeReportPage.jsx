import React, { useState, useEffect, useContext } from "react";
import { getEmployees } from "../api/employeeApi";
import AdminAuthContext from "../context/AdminAuthContext";

function EmployeeReportPage() {
  const { adminToken } = useContext(AdminAuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);

  // Only show a single button to create the report
  const handleCreateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEmployees();
      const now = new Date();
      const reportDate = now.toLocaleDateString("lo-LA", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      const reportTime = now.toLocaleTimeString("lo-LA", {
        hour: "2-digit",
        minute: "2-digit",
      });
      let reportHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Employee Report</title>
            <style>
                body { font-family: 'Noto Sans Lao', sans-serif; margin: 20px; color: #333; }
                .container { max-width: 100%; margin: 0 auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
                .header { text-align: left; margin-bottom: 30px; }
                .header img { height: 80px; margin-bottom: 10px; }
                h1 { color: #000; text-align: center; font-size: 2em; margin-bottom: 5px; }
                .company-info { text-align: left; margin-bottom: 30px; }
                .table-container { margin-top: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; white-space: nowrap; }
                th:nth-child(1) { width: 5%; }
                th:nth-child(2) { width: 10%; }
                th:nth-child(3) { width: 20%; }
                th:nth-child(4) { width: 20%; }
                th:nth-child(5) { width: 20%; }
                th:nth-child(6) { width: 10%; }
                th:nth-child(7) { width: 15%; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                @media print { .print-hidden { display: none; } }
            </style>
        </head>
        <body>
            <button onclick="window.print()" class="print-hidden" style="margin-bottom:20px;padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;">ພິມລາຍງານ</button>
            <div class="container">
                <div class="header">
                    <img src="https://res.cloudinary.com/dgfk0ljyq/image/upload/v1749228072/web_icon_t8i1f2.png" alt="Store Logo">
                    <p style="text-align: right; margin-top: 10px;">ວັນທີ: ${reportDate}<br/>ເວລາ: ${reportTime}</p>
                </div>
                <div class="company-info">
                    <p><strong>ຮ້ານ MR.IT</strong></p>
                </div>
                <h1>ລາຍງານພະນັກງານ</h1>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ລ/ດ</th>
                                <th>Employee ID</th>
                                <th>Username</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data
                              .map(
                                (emp, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td>${emp.employee_code || ""}</td>
                                    <td>${emp.username || ""}</td>
                                    <td>${emp.name || ""}</td>
                                    <td>${emp.email || ""}</td>
                                    <td>${emp.phone || ""}</td>
                                    <td>${emp.role || ""}</td>
                                </tr>
                              `
                              )
                              .join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
      `;
      const printWindow = window.open("", "_blank");
      printWindow.document.write(reportHtml);
      printWindow.document.close();
    } catch (err) {
      setError(err.message || "Failed to generate report");
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">ລາຍງານພະນັກງານ</h1>
      <button
        onClick={handleCreateReport}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4"
        disabled={loading}
      >
        {loading ? "ກຳລັງສ້າງ..." : "ສ້າງລາຍງານ"}
      </button>
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
}

export default EmployeeReportPage;
