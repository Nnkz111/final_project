const express = require("express");
const router = express.Router();
const multer = require("multer"); // Import multer
const path = require("path"); // Import path module
const fs = require("fs"); // Import fs module for directory creation
const cloudinary = require("cloudinary").v2; // Import Cloudinary

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on route
    if (req.originalUrl === "/api/upload") {
      const categoryUploadDir = path.join(
        __dirname,
        "../uploads/categories_img"
      );
      // Create directory if it doesn't exist
      if (!fs.existsSync(categoryUploadDir)) {
        fs.mkdirSync(categoryUploadDir, { recursive: true });
      }
      cb(null, categoryUploadDir);
    } else if (req.originalUrl.startsWith("/api/orders")) {
      // Existing logic for payment proofs
      cb(null, "uploads/payment_proof/");
    } else {
      // Default destination
      cb(null, "uploads/");
    }
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage: storage });

// Category Image Upload Endpoint (Admin only)
router.post("/", async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Assuming the file input field name is 'image'
    const file = req.files.image; // Access the uploaded file via req.files

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "category_images", // Optional: specify a folder in Cloudinary
    });

    // The result object contains information about the uploaded image
    const imageUrl = result.url; // This is the public URL of the uploaded image
    const publicId = result.public_id; // This is the public ID of the image in Cloudinary

    // You might want to save the imageUrl and/or publicId to your database
    // For this example, we'll just return the URL.

    res.json({ url: imageUrl, publicId: publicId });
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    res
      .status(500)
      .json({ error: "Image upload failed", details: error.message });
  }
});

module.exports = router;
