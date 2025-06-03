import React from "react";

const QrModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null; // Don't render if no image URL is provided

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose} // Close modal when clicking outside the image
    >
      <div
        className="bg-white p-4 rounded-lg shadow-lg max-w-sm max-h-full overflow-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the image container
      >
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-2xl font-bold"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <img
          src={imageUrl}
          alt="QR Code"
          className="max-w-full max-h-full object-contain"
        />
      </div>
    </div>
  );
};

export default QrModal;
