const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set default upload parameters for all uploads
cloudinary.config({
  upload_preset: {
    transformation: [{ format: "webp", quality: "auto" }],
  },
});

module.exports = cloudinary;
