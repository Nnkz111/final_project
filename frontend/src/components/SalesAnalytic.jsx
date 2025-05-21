import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const GROUP_OPTIONS = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];
const STATUS_OPTIONS = [
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Shipped", value: "shipped" },
  { label: "Cancelled", value: "cancelled" },
];
const PAYMENT_OPTIONS = [
  { label: "All", value: "" },
  { label: "COD", value: "cod" },
  { label: "Bank Transfer", value: "bank_transfer" },
];

function SalesAnalytic() {
  const [group, setGroup] = useState("month");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [status, setStatus] = useState("completed");
  const [paymentType, setPaymentType] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const params = [
          `group=${group}`,
          status ? `status=${status}` : "",
          start ? `start=${start}` : "",
          end ? `end=${end}` : "",
          paymentType ? `payment_type=${paymentType}` : "",
        ]
          .filter(Boolean)
          .join("&");
        const res = await fetch(
          `http://localhost:5000/api/admin/sales-analytics?${params}`
        );
        if (!res.ok) throw new Error("Failed to fetch sales analytics");
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [group, start, end, status, paymentType]);

  // Calculate total sales for the period
  const totalSales = data.reduce((sum, d) => sum + parseFloat(d.total), 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Sales Analytic
      </h3>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <div className="text-gray-700 font-semibold text-base">
          Total Sales:{" "}
          <span className="text-green-700 font-bold">
            $
            {totalSales.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
          <label>
            Group by
            <select
              className="ml-1 border rounded-md px-2 py-1"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              {GROUP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              className="ml-1 border rounded-md px-2 py-1"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Payment
            <select
              className="ml-1 border rounded-md px-2 py-1"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              {PAYMENT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Start
            <input
              type="date"
              className="ml-1 border rounded-md px-2 py-1"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            End
            <input
              type="date"
              className="ml-1 border rounded-md px-2 py-1"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="mt-6 h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading chart...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip
                labelFormatter={(label) => label}
                formatter={(value) =>
                  `$${parseFloat(value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                }
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#16a34a"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default SalesAnalytic;
