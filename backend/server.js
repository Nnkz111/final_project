const express = require("express");
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables from .env file immediately
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");
const pool = require("./config/db");

// Test database connection immediately
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to the database:", err.stack);
  } else {
    console.log("Successfully connected to database");
    release();
  }
});

const productRoutes = require("./routes/productRoutes");
const authenticateToken = require("./middleware/authMiddleware");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profileRoutes");

// Create an Express application
const app = express();

console.log("Backend server starting..."); // New log here

// Use cors middleware with proper configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [
            "https://test-project-frontend.onrender.com",
            process.env.FRONTEND_URL,
          ].filter(Boolean)
        : "http://localhost:5173",
    credentials: true,
  })
);

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to handle file uploads using express-fileupload
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

// Middleware to parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Define the port - Render requires port 10000 for web services
const port = process.env.PORT || 5000;
console.log(`Configured to use port: ${port}`);

// Add health check endpoint
app.get("/", (req, res) => {
  res.send("Backend server is running");
});

// Use product routes
app.use("/api/products", productRoutes);

// Use category routes
app.use("/api/categories", categoryRoutes);

// Use cart routes
app.use("/api/cart", cartRoutes);

// Use authentication routes
app.use("/api/auth", authRoutes);

// Use order routes
app.use("/api/orders", orderRoutes);

// Use upload routes
app.use("/api/upload", uploadRoutes);

// Use notification routes
app.use("/api/notifications", notificationRoutes);

// Use admin routes
app.use("/api/admin", adminRoutes);

// Use profile routes
app.use("/api/profile", profileRoutes);

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
