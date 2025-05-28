import React from "react";
import { useTranslation } from "react-i18next";
function ConfirmationModal({ message, isOpen, onConfirm, onCancel }) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative p-6 bg-white rounded-lg shadow-xl max-w-sm mx-auto">
        <div className="text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            {t("Confirm Action")}
          </h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-green-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {t("Confirm")}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {t("Cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
