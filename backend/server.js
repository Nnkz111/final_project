// Import the express library
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

// Create an Express application
const app = express();

// Use cors middleware to allow cross-origin requests
app.use(cors());

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

// Endpoint to get a single product by ID
app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params; // Get the product ID from the URL parameters
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]); // Send the first row (the product) as JSON
    } else {
      res.status(404).json({ error: "Product not found" }); // Send 404 if no product is found
    }
  } catch (err) {
    console.error(`Error fetching product with ID ${id}:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cart routes
// Get cart items for a user
app.get("/api/cart/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    // Join cart_items with products to get product details
    const result = await pool.query(
      "SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(`Error fetching cart for user ${userId}:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add or update an item in the user's cart
app.post("/api/cart/add", async (req, res) => {
  const { userId, productId, quantity = 1 } = req.body; // Default quantity to 1 if not provided

  if (!userId || !productId) {
    return res.status(400).json({ error: "userId and productId are required" });
  }

  try {
    // Check if the item already exists for the user
    const existingItem = await pool.query(
      "SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2",
      [userId, productId]
    );

    if (existingItem.rows.length > 0) {
      // If item exists, update the quantity
      const updatedQuantity = existingItem.rows[0].quantity + quantity;
      await pool.query(
        "UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3",
        [updatedQuantity, userId, productId]
      );
      res.status(200).json({ message: "Cart item quantity updated" });
    } else {
      // If item doesn't exist, insert a new item
      await pool.query(
        "INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)",
        [userId, productId, quantity]
      );
      res.status(201).json({ message: "Product added to cart" });
    }
  } catch (err) {
    console.error(`Error adding/updating cart item for user ${userId}:`, err);
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
