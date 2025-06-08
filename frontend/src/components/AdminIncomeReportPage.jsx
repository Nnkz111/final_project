import React from "react";
import SalesAnalytic from "./SalesAnalytic";
import { useTranslation } from "react-i18next";

function AdminIncomeReportPage() {
  const { t } = useTranslation();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-green-700">
        ລາຍງານຂໍ້ມູນລາຍຮັບ
      </h1>
      <SalesAnalytic />
    </div>
  );
}

export default AdminIncomeReportPage;
