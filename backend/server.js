const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
dotenv.config();
const cors = require("cors");
const path = require("path");
const fileUpload = require("express-fileupload");
const pool = require("./config/db");

// Request timeout middleware
const timeout = require('connect-timeout');
const TIMEOUT_DURATION = '30s';

// Timeout handler
const haltOnTimedout = (req, res, next) => {
  if (!req.timedout) next();
};

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

// Add timeout middleware
app.use(timeout(TIMEOUT_DURATION));
app.use(haltOnTimedout);

console.log("Backend server starting..."); // New log here

// Use cors middleware with proper configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_DEV_URL || "http://localhost:5173",
  process.env.FRONTEND_PROD_URL,
].filter(Boolean);

// Log the current environment
console.log("Current environment:", process.env.NODE_ENV);

console.log("Allowed CORS origins:", allowedOrigins); // For debugging

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        console.log("Blocked origin:", origin); // For debugging
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
