const express = require("express");
const router = express.Router();

const cloudinary = require("cloudinary").v2; // Import Cloudinary

// Category Image Upload Endpoint (Admin only)
router.post("/", async (req, res) => {
  try {
    // Check if a file was uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Assuming the file input field name is 'image'
    const file = req.files.image; // Access the uploaded file via req.files

    // Validate file type and size
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    const maxSize = 5 * 1024 * 1024; // 5 MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error:
          "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.",
      });
    }

    if (file.size > maxSize) {
      return res.status(400).json({
        error: `File size exceeds the limit of ${maxSize / (1024 * 1024)} MB.`,
      });
    }

    // Upload the file to Cloudinary with WebP conversion
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "category_images", // Optional: specify a folder in Cloudinary
      format: "webp", // Force WebP format
      quality: "auto", // Automatic quality optimization
      fetch_format: "auto", // Deliver in WebP when browser supports it
      flags: "lossy", // Use lossy compression for better optimization
      transformation: [
        {
          fetch_format: "webp",
          quality: "auto",
        },
      ],
    });

    // The result object contains information about the uploaded image
    const imageUrl = result.url; // This is the public URL of the uploaded image
    const publicId = result.public_id; // This is the public ID of the image in Cloudinary

    // Return the WebP URL
    res.json({
      url: imageUrl,
      publicId: publicId,
      format: "webp",
    });
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    res
      .status(500)
      .json({ error: "Image upload failed", details: error.message });
  }
});

module.exports = router;
