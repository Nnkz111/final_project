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
import { useTranslation } from "react-i18next";

const GROUP_OPTIONS = [
  { label: "salesAnalytic.groupOption.day", value: "day" },
  { label: "salesAnalytic.groupOption.week", value: "week" },
  { label: "salesAnalytic.groupOption.month", value: "month" },
  { label: "salesAnalytic.groupOption.year", value: "year" },
];

function SalesAnalytic() {
  const [group, setGroup] = useState("day");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const params = [
          `group=${group}`,
          start ? `start=${start}` : "",
          end ? `end=${end}` : "",
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
  }, [group, start, end]);

  // Calculate total sales for the period
  const totalSales = data.reduce((sum, d) => sum + parseFloat(d.total), 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mt-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {t("salesAnalytic.title")}
      </h3>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <div className="text-gray-700 font-semibold text-base">
          {t("salesAnalytic.totalSalesLabel")}:{" "}
          <span className="text-green-700 font-bold">
            {totalSales.toLocaleString("lo-LA", {
              style: "currency",
              currency: "LAK",
            })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
          <label>
            {t("salesAnalytic.groupByLabel")}
            <select
              className="ml-1 border rounded-md px-2 py-1"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              {GROUP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.label)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("salesAnalytic.startLabel")}
            <input
              type="date"
              className="ml-1 border rounded-md px-2 py-1"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            {t("salesAnalytic.endLabel")}
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
            {t("salesAnalytic.loadingChart")}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">
            {t("salesAnalytic.error", { error: error })}
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
                  parseFloat(value).toLocaleString("lo-LA", {
                    style: "currency",
                    currency: "LAK",
                  })
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
