// Import the express library
const express = require("express");
const { Pool } = require("pg");

// Create an Express application
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

// Define the port to run the server on
const port = process.env.PORT || 5000;

// Database connection pool setup
const pool = new Pool({
  user: "postgres", // Replace with your PostgreSQL username
  host: "localhost", // Replace with your PostgreSQL host
  database: "e_commerce", // Replace with your PostgreSQL database name
  password: "123", // Replace with your PostgreSQL password
  port: 5432, // Default PostgreSQL port
});

// Test database connection (optional, but good practice)
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  console.log("Database connected successfully!");
  release();
});

// Define a basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Product routes
// Endpoint to get all products
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Placeholder for product routes
// We will add product-specific endpoints here later
// Example: app.get('/api/products', async (req, res) => { ... });

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
