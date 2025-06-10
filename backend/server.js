require("dotenv").config(); // Load environment variables from .env file

// Import the express library
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer"); // Import multer
const path = require("path"); // Import path module
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs"); // Import fs module for directory creation
const cloudinary = require("cloudinary").v2; // Import Cloudinary
const fileUpload = require("express-fileupload");

// Create an Express application
const app = express();

// Use cors middleware to allow cross-origin requests
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Middleware to handle file uploads using express-fileupload
app.use(
  fileUpload({
    useTempFiles: true,
  })
);

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Define the port to run the server on
const port = process.env.PORT || 5000;

// Database connection pool setup
const pool = new Pool({
  user: process.env.DB_USER, // Use environment variable for username
  host: process.env.DB_HOST, // Use environment variable for host
  database: process.env.DB_DATABASE, // Use environment variable for database name
  password: process.env.DB_PASSWORD, // Use environment variable for password
  port: process.env.DB_PORT, // Use environment variable for port
});

// Test database connection (optional, but good practice)
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  console.log("Database connected successfully!");
  release();
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Use environment variable for cloud name
  api_key: process.env.CLOUDINARY_API_KEY, // Use environment variable for API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Use environment variable for API secret
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on route
    if (req.originalUrl === "/api/upload") {
      const categoryUploadDir = path.join(__dirname, "uploads/categories_img");
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

// Define a basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Product routes
// Add a new endpoint to get new arrival products (public)
app.get("/api/products/new-arrivals", async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 5; // Default to 5 products
  try {
    const result = await pool.query(
      `
      SELECT id, name, image_url, price
      FROM products
      ORDER BY created_at DESC
      LIMIT $1
    `,
      [limit]
    ); // Use limit parameter
    res.json(result.rows);
  } catch (err) {
    // console.error("Error fetching new arrival products:", err); // Removed unnecessary error log
    res.status(500).json({
      error: "Failed to fetch new arrival products",
      details: err.message,
    });
  }
});

// Add a new endpoint to get top 5 selling products (public)
app.get("/api/products/top-selling", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, p.image_url, p.price, SUM(oi.quantity) AS total_quantity // Include image_url and price
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
      GROUP BY p.id, p.name, p.image_url, p.price // Group by all selected product columns
      ORDER BY total_quantity DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching top selling products for homepage:", err);
    res.status(500).json({
      error: "Failed to fetch top selling products",
      details: err.message,
    });
  }
});

// Endpoint to get all products (with pagination, category filter, and search)
app.get("/api/products", async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = parseInt(req.query.offset, 10) || 0;
  const {
    category_id,
    sort_by_price,
    query: searchTerm,
    low_stock,
  } = req.query; // Get category_id, sort_by_price, and searchTerm from query

  let orderByClause = "ORDER BY id DESC"; // Default sorting
  if (sort_by_price === "lowToHigh") {
    orderByClause = "ORDER BY price ASC";
  } else if (sort_by_price === "highToLow") {
    orderByClause = "ORDER BY price DESC";
  }

  let whereClauses = [];
  let whereParams = [];
  let paramIndex = 1;

  // Add category filter clause
  if (category_id) {
    // Assuming category_id is a single ID string from the frontend filter
    whereClauses.push(`category_id = $${paramIndex++}`);
    whereParams.push(category_id);
  }

  // Add search term clause
  if (searchTerm) {
    whereClauses.push(
      `(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex + 1})`
    );
    whereParams.push(`%${searchTerm}%`);
    whereParams.push(`%${searchTerm}%`);
    paramIndex += 2; // Increment paramIndex by 2 for the two placeholders
  }

  // Add low stock filter clause
  if (low_stock === "true") {
    whereClauses.push(`stock_quantity < 3`); // Filter for stock less than 3
  }

  const where = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const dataQueryParams = [...whereParams, limit, offset];

  try {
    const dataResult = await pool.query(
      `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where} ${orderByClause} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      dataQueryParams
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM products ${where}`,
      whereParams // Use only whereParams for the count query
    );

    res.json({
      products: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// New endpoint to search for products
app.get("/api/products/search", async (req, res) => {
  const searchTerm = req.query.query; // Get the search term from query parameters
  const { sort_by_price } = req.query; // Get sort_by_price from query

  if (!searchTerm) {
    return res
      .status(400)
      .json({ error: "Search query parameter is required" });
  }

  let orderByClause = ""; // Default no specific sorting for search relevance initially
  if (sort_by_price === "lowToHigh") {
    orderByClause = "ORDER BY price ASC";
  } else if (sort_by_price === "highToLow") {
    orderByClause = "ORDER BY price DESC";
  }

  try {
    // Use a case-insensitive search for product name or description
    // Include stock_quantity in the select statement
    const result = await pool.query(
      `
      SELECT id, name, description, price, image_url, stock_quantity
      FROM products
      WHERE name ILIKE $1 OR description ILIKE $1
      ${orderByClause}
      `,
      [`%${searchTerm}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error searching products:", err);
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

// Add a new product with image upload
// This route now uses Cloudinary for image uploads.
app.post("/api/products", authenticateToken, async (req, res) => {
  const { name, description, price, stock_quantity, category_id } = req.body;

  let imageUrl = null;

  // Check if a file was uploaded with the field name 'productImage'
  if (req.files && req.files.productImage) {
    const file = req.files.productImage;

    try {
      // Upload the file to Cloudinary
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "product_images", // Optional: specify a folder in Cloudinary
      });
      imageUrl = result.url; // Get the Cloudinary image URL
    } catch (error) {
      console.error("Error uploading product image to Cloudinary:", error);
      // Continue without image or return an error, depending on requirements
      // For now, we'll proceed without the image but log the error.
    }
  }

  // Basic validation
  if (!name || !price || !stock_quantity) {
    return res
      .status(400)
      .json({ error: "Name, price, and stock_quantity are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO products (name, description, price, stock_quantity, image_url, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        name,
        description || null,
        parseFloat(price),
        parseInt(stock_quantity, 10),
        imageUrl,
        category_id || null,
      ]
    );
    res.status(201).json(result.rows[0]); // Return the newly created product
  } catch (err) {
    console.error("Error adding new product:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE endpoint to remove a product by ID
app.delete("/api/products/:id", authenticateToken, async (req, res) => {
  // Check if the authenticated user is an admin
  if (!req.user || !req.user.is_admin) {
    return res.sendStatus(403); // Forbidden if not an admin
  }

  const { id } = req.params; // Get the product ID from the URL

  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ message: "Product deleted successfully" });
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (err) {
    console.error(`Error deleting product with ID ${id}:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT endpoint to update a product by ID with optional image upload
// This route now uses Cloudinary for image uploads.
app.put("/api/products/:id", authenticateToken, async (req, res) => {
  // Check if the authenticated user is an admin
  if (!req.user || !req.user.is_admin) {
    return res.sendStatus(403); // Forbidden if not an admin
  }

  const { id } = req.params; // Get the product ID from the URL
  const {
    name,
    description,
    price,
    stock_quantity,
    category_id,
    image_url: existingImageUrl,
  } = req.body; // Get existing image_url from body

  let imageUrl = existingImageUrl; // Start with the existing URL

  // Check if a new file was uploaded with the field name 'productImage'
  if (req.files && req.files.productImage) {
    const file = req.files.productImage;

    try {
      // Upload the new file to Cloudinary
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "product_images", // Optional: specify a folder in Cloudinary
      });
      imageUrl = result.url; // Use the new Cloudinary image URL
      // Optional: You might want to delete the old image from Cloudinary here
      // if existingImageUrl was a Cloudinary URL.
    } catch (error) {
      console.error("Error uploading new product image to Cloudinary:", error);
      // Decide how to handle upload failure: keep old image, set to null, or return error
      // For now, we'll keep the existingImageUrl if upload fails.
    }
  }

  // Basic validation (ensure at least one field to update is provided)
  if (
    !name &&
    !description &&
    !price &&
    !stock_quantity &&
    !imageUrl &&
    !category_id
  ) {
    return res.status(400).json({ error: "No update data provided." });
  }

  try {
    // Build the SET clause for the SQL query dynamically based on provided fields
    const updateFields = [];
    const queryParams = [id]; // Start with product ID
    let paramIndex = 2; // Start index for other parameters

    if (name) {
      updateFields.push(`name = $${paramIndex++}`);
      queryParams.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      queryParams.push(description);
    } // Allow description to be set to null/empty
    if (price) {
      updateFields.push(`price = $${paramIndex++}`);
      queryParams.push(price);
    }
    if (stock_quantity !== undefined) {
      updateFields.push(`stock_quantity = $${paramIndex++}`);
      queryParams.push(stock_quantity);
    } // Allow stock to be set to 0
    if (imageUrl !== undefined) {
      updateFields.push(`image_url = $${paramIndex++}`);
      queryParams.push(imageUrl);
    } // Allow image_url to be set to null
    if (category_id !== undefined) {
      updateFields.push(`category_id = $${paramIndex++}`);
      queryParams.push(category_id || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    const query = `UPDATE products SET ${updateFields.join(
      ", "
    )} WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, queryParams);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]); // Return the updated product
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (err) {
    console.error(`Error updating product with ID ${id}:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Category routes
// Endpoint to get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, parent_id, image_url FROM categories"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to add a new category (Admin only)
app.post("/api/categories", authenticateToken, async (req, res) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { name, parent_id, image_url } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO categories (name, parent_id, image_url) VALUES ($1, $2, $3) RETURNING id, name, parent_id, image_url",
      [name, parent_id || null, image_url || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

// Endpoint to update a category by ID (Admin only)
app.put("/api/categories/:id", authenticateToken, async (req, res) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { id } = req.params;
  const { name, parent_id, image_url } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    const result = await pool.query(
      "UPDATE categories SET name = $1, parent_id = $2, image_url = $3 WHERE id = $4 RETURNING id, name, parent_id, image_url",
      [name, parent_id || null, image_url || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update category" });
  }
});

// Endpoint to delete a category by ID (Admin only)
app.delete("/api/categories/:id", authenticateToken, async (req, res) => {
  // Check if the authenticated user is an admin
  if (!req.user || !req.user.is_admin) {
    return res.sendStatus(403); // Forbidden if not an admin
  }

  const { id } = req.params; // Category ID from URL

  try {
    const result = await pool.query(
      "DELETE FROM categories WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ message: "Category deleted successfully" });
    } else {
      res.status(404).json({ error: "Category not found" });
    }
  } catch (err) {
    console.error(`Error deleting category with ID ${id}:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cart routes
// Get cart items for a user
app.get("/api/cart/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const authenticatedUserId = req.user.userId; // Get user ID from authenticated token

  // Ensure the authenticated user is requesting their own cart
  if (parseInt(userId) !== authenticatedUserId) {
    return res.sendStatus(403); // Forbidden
  }

  try {
    // Use the authenticated user ID for the database query
    // Include product.stock_quantity in the select statement
    const result = await pool.query(
      "SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url, p.stock_quantity FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = $1",
      [authenticatedUserId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(`Error fetching cart for user ${userId}:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get total item count for a user's cart
app.get("/api/cart/count/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const authenticatedUserId = req.user.userId; // Get user ID from authenticated token

  // Ensure the authenticated user is requesting their own cart count
  if (parseInt(userId) !== authenticatedUserId) {
    return res.sendStatus(403); // Forbidden
  }

  try {
    // Use the authenticated user ID for the database query
    const result = await pool.query(
      "SELECT SUM(quantity) AS total_quantity FROM cart_items WHERE user_id = $1",
      [authenticatedUserId]
    );
    // The result might be null if the cart is empty, return 0 in that case
    const totalQuantity = result.rows[0].total_quantity || 0;
    res.json({ count: parseInt(totalQuantity, 10) }); // Ensure count is an integer
  } catch (err) {
    console.error(`Error fetching cart count for user ${userId}:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add or update an item in the user's cart
app.post("/api/cart/add", authenticateToken, async (req, res) => {
  const { productId, quantity = 1 } = req.body; // Remove userId from body
  const authenticatedUserId = req.user.userId; // Get user ID from authenticated token

  if (!productId || quantity <= 0) {
    return res
      .status(400)
      .json({ error: "Product ID and a positive quantity are required" });
  }

  try {
    const client = await pool.connect(); // Use a client from the pool for transactions
    try {
      await client.query("BEGIN");

      // Get product stock information
      const productResult = await client.query(
        "SELECT stock_quantity FROM products WHERE id = $1",
        [productId]
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Product not found" });
      }

      const availableStock = productResult.rows[0].stock_quantity;

      // Check if the item already exists for the authenticated user
      const existingItem = await client.query(
        "SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2",
        [authenticatedUserId, productId]
      );

      let newTotalQuantity = quantity;

      if (existingItem.rows.length > 0) {
        // If item exists, calculate the new total quantity
        newTotalQuantity = existingItem.rows[0].quantity + quantity;
      }

      // Validate against available stock
      if (newTotalQuantity > availableStock) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Requested quantity exceeds available stock" });
      }

      if (existingItem.rows.length > 0) {
        // If item exists, update the quantity for the authenticated user
        await client.query(
          "UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3",
          [newTotalQuantity, authenticatedUserId, productId]
        );
        res.status(200).json({ message: "Cart item quantity updated" });
      } else {
        // If item doesn't exist, insert a new item for the authenticated user
        await client.query(
          "INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)",
          [authenticatedUserId, productId, quantity]
        );
        res.status(201).json({ message: "Product added to cart" });
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err; // Re-throw the error to be caught by the outer catch block
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(
      `Error adding/updating cart item for user ${authenticatedUserId}:`,
      err
    );
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove an item from the user's cart
app.delete(
  "/api/cart/remove/:cartItemId",
  authenticateToken,
  async (req, res) => {
    const { cartItemId } = req.params;
    const authenticatedUserId = req.user.userId; // Get user ID from authenticated token

    try {
      // First, get the user_id of the cart item to ensure the authenticated user owns it
      const cartItemResult = await pool.query(
        "SELECT user_id FROM cart_items WHERE id = $1",
        [cartItemId]
      );
      if (cartItemResult.rows.length === 0) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      const cartItemUserId = cartItemResult.rows[0].user_id;

      // Ensure the authenticated user owns the cart item they are trying to remove
      if (cartItemUserId !== authenticatedUserId) {
        return res.sendStatus(403); // Forbidden
      }

      // Delete the cart item since the user is authorized
      const result = await pool.query(
        "DELETE FROM cart_items WHERE id = $1 RETURNING id",
        [cartItemId]
      );
      if (result.rows.length > 0) {
        res.status(200).json({ message: "Cart item removed" });
      } else {
        // This case should ideally not be reached if the previous check passed,
        // but included for robustness.
        res
          .status(404)
          .json({ error: "Cart item not found after authorization check" });
      }
    } catch (err) {
      console.error(`Error removing cart item ${cartItemId}:`, err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update the quantity of a cart item
app.put("/api/cart/update/:cartItemId", authenticateToken, async (req, res) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;
  const authenticatedUserId = req.user.userId; // Get user ID from authenticated token

  if (quantity === undefined || quantity <= 0) {
    return res
      .status(400)
      .json({ error: "Valid quantity (greater than 0) is required" });
  }

  try {
    const client = await pool.connect(); // Use a client for transactions
    try {
      await client.query("BEGIN");
      // First, get the product_id and current quantity of the cart item, and its user_id
      const cartItemResult = await client.query(
        "SELECT user_id, product_id, quantity FROM cart_items WHERE id = $1",
        [cartItemId]
      );
      if (cartItemResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Cart item not found" });
      }
      const {
        user_id: cartItemUserId,
        product_id,
        quantity: currentQuantity,
      } = cartItemResult.rows[0];

      // Ensure the authenticated user owns the cart item they are trying to update
      if (cartItemUserId !== authenticatedUserId) {
        await client.query("ROLLBACK");
        return res.sendStatus(403); // Forbidden
      }

      // Get product stock information
      const productResult = await client.query(
        "SELECT stock_quantity FROM products WHERE id = $1",
        [product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Product not found" });
      }

      const availableStock = productResult.rows[0].stock_quantity;

      // Validate against available stock
      if (quantity > availableStock) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Requested quantity exceeds available stock" });
      }

      // Update the cart item quantity since the user is authorized
      const result = await client.query(
        "UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING id",
        [quantity, cartItemId]
      );

      await client.query("COMMIT");

      if (result.rows.length > 0) {
        res.status(200).json({ message: "Cart item quantity updated" });
      } else {
        res.status(500).json({ error: "Failed to update cart item quantity" });
      }
    } catch (err) {
      await client.query("ROLLBACK");
      throw err; // Re-throw the error to be caught by the outer catch block
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`Error updating cart item ${cartItemId} quantity:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Clear all items from the user's cart
app.delete("/api/cart/clear", authenticateToken, async (req, res) => {
  const authenticatedUserId = req.user.userId;
  try {
    await pool.query("DELETE FROM cart_items WHERE user_id = $1", [
      authenticatedUserId,
    ]);
    res.status(200).json({ message: "Cart cleared" });
  } catch (err) {
    console.error(`Error clearing cart for user ${authenticatedUserId}:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Placeholder for product routes
// We will add product-specific endpoints here later
// Example: app.get('/api/products', async (req, res) => { ... });

// Secret key for JWT (should be stored securely, e.g., in environment variables)
const jwtSecret = process.env.JWT_SECRET; // Use environment variable for JWT secret

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Get token from 'Bearer TOKEN' format

  if (token == null) {
    return res.sendStatus(401); // If there is no token, return unauthorized
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.error("JWT verification error:", err); // Debugging line
      return res.sendStatus(403); // If token is invalid, return forbidden
    }
    req.user = user; // Attach user information to the request
    next(); // Proceed to the next middleware or route handler
  });
}

// User Authentication Routes

// Register a new user
app.post("/api/auth/register", async (req, res) => {
  const { email, password, username, name } = req.body; // Include name

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ error: "User with this email already exists" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN"); // Start transaction

      // Hash the password
      const saltRounds = 10; // Cost factor for hashing
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insert the new user into the users table
      const userResult = await client.query(
        "INSERT INTO users (email, password_hash, username, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, email, username, is_admin",
        [email, passwordHash, username, false]
      );
      const newUser = userResult.rows[0];

      // Insert the customer information into the customers table
      // Use the newly created user's ID
      await client.query(
        "INSERT INTO customers (user_id, name, email) VALUES ($1, $2, $3)",
        [newUser.id, name || null, email || null] // Store name, allow null if not provided (though form requires it)
      );

      await client.query("COMMIT"); // Commit the transaction

      // Create a JWT token
      const token = jwt.sign(
        {
          userId: newUser.id,
          email: newUser.email,
          is_admin: newUser.is_admin,
        },
        jwtSecret,
        { expiresIn: "2d" }
      );

      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          is_admin: newUser.is_admin,
        },
      });
    } catch (err) {
      await client.query("ROLLBACK"); // Rollback transaction on error
      throw err; // Re-throw the error to be caught by the outer catch block
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login user
app.post("/api/auth/login", async (req, res) => {
  const { email, password, username } = req.body;

  // Basic validation
  if ((!email && !username) || !password) {
    return res
      .status(400)
      .json({ error: "Email or username, and password are required" });
  }

  try {
    // Find the user by email or username and join with customers table
    const result = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.password_hash,
         u.is_admin,
         c.name AS customer_name,
         c.phone AS customer_phone,
         c.address AS customer_address
       FROM users u
       LEFT JOIN customers c ON u.id = c.user_id
       WHERE u.email = $1 OR u.username = $2`,
      [email, username]
    );
    const user = result.rows[0];

    if (!user) {
      // User not found
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Passwords do not match
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Passwords match, create a JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      is_admin: user.is_admin,
    };

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: "2d" });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        is_admin: user.is_admin,
        customer: {
          // Include customer object with name, phone, and address
          name: user.customer_name,
          phone: user.customer_phone,
          address: user.customer_address,
        },
      },
    }); // Return token and basic user info
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Place this after cart routes, before app.listen
// Removed Multer middleware from order creation route
// const uploadOrderProof = multer({ storage: storage });
app.post(
  "/api/orders",
  // Removed uploadOrderProof.single("payment_proof"),
  async (req, res) => {
    try {
      // Parse fields from FormData
      const userId = req.body.userId;
      const items = JSON.parse(req.body.items);
      const shipping = JSON.parse(req.body.shipping);
      const payment_type = req.body.payment_type;

      let payment_proof = null;

      // Check if a payment proof file was uploaded with the field name 'payment_proof'
      if (req.files && req.files.payment_proof) {
        const file = req.files.payment_proof;

        try {
          // Upload the file to Cloudinary
          const result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: "payment_proofs", // Optional: specify a folder in Cloudinary
          });
          payment_proof = result.url; // Get the Cloudinary image URL
        } catch (error) {
          console.error("Error uploading payment proof to Cloudinary:", error);
          // Decide how to handle upload failure
          // For now, we'll proceed without the payment proof image but log the error.
        }
      }

      if (
        !userId ||
        !items ||
        !Array.isArray(items) ||
        items.length === 0 ||
        !shipping
      ) {
        return res.status(400).json({ error: "Missing order data" });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        // Insert order
        const orderResult = await client.query(
          `INSERT INTO orders (user_id, shipping_name, shipping_address, shipping_phone, shipping_email, status, payment_type, payment_proof, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING id`,
          [
            userId,
            shipping.name,
            shipping.address,
            shipping.phone,
            shipping.email,
            "pending", // default status
            payment_type,
            payment_proof,
          ]
        );
        const orderId = orderResult.rows[0].id;
        // Insert order items
        for (const item of items) {
          // Get product stock information
          const productResult = await client.query(
            "SELECT stock_quantity, name FROM products WHERE id = $1",
            [item.product_id || item.id]
          );

          if (productResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
              error: `Product with ID ${item.product_id || item.id} not found`,
            });
          }

          const availableStock = productResult.rows[0].stock_quantity;
          const productName = productResult.rows[0].name;

          // Validate against available stock
          if (item.quantity > availableStock) {
            await client.query("ROLLBACK");
            return res.status(400).json({
              error: `Insufficient stock for ${productName}. Available: ${availableStock}, Requested: ${item.quantity}`,
            });
          }

          await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
            [orderId, item.product_id || item.id, item.quantity, item.price]
          );
          // Deduct stock
          await client.query(
            `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
            [item.quantity, item.product_id || item.id]
          );
        }
        // Calculate total and update order
        const totalResult = await client.query(
          `SELECT COALESCE(SUM(price * quantity), 0) AS total FROM order_items WHERE order_id = $1`,
          [orderId]
        );
        const total = totalResult.rows[0].total;
        await client.query(`UPDATE orders SET total = $1 WHERE id = $2`, [
          total,
          orderId,
        ]);

        // Insert notification for new order (Admin Notification)
        await client.query(
          "INSERT INTO notifications (type, order_id, message) VALUES ($1, $2, $3)",
          ["new_order", orderId, `ມີຄຳສັ່ງຊື້ໃໝ່ (ເລກທີ: ${orderId})`]
        );

        // Insert notification for customer when order is placed (Customer Notification)
        if (userId) {
          // Ensure userId is available
          const notificationType = "customer_order_placed";
          const notificationMessageKey = "notification.customer_order_placed";
          await client.query(
            "INSERT INTO notifications (user_id, type, order_id, message, is_read) VALUES ($1, $2, $3, $4, false)",
            [userId, notificationType, orderId, notificationMessageKey]
          );
        }

        await client.query("COMMIT");
        res.status(201).json({ message: "Order placed successfully", orderId });
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error placing order:", err);
        res.status(500).json({ error: "Failed to place order" });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error parsing order data:", err);
      res.status(500).json({ error: "Failed to parse order data" });
    }
  }
);

// Get order details by order ID (including items and payment proof)
app.get("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Get order
    const orderResult = await pool.query(`SELECT * FROM orders WHERE id = $1`, [
      id,
    ]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    const order = orderResult.rows[0];
    // Get order items with product info
    const itemsResult = await pool.query(
      `SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );
    order.items = itemsResult.rows;
    // If total is missing or 0, calculate it from items
    if (
      !order.total ||
      isNaN(parseFloat(order.total)) ||
      parseFloat(order.total) === 0
    ) {
      order.total = order.items
        .reduce(
          (sum, item) => sum + Number(item.price) * Number(item.quantity),
          0
        )
        .toFixed(2);
    }
    res.json(order);
  } catch (err) {
    console.error("Error fetching order details:", err);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});

// Get all orders for a user (with item count and total)
app.get("/api/orders/user/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const authenticatedUserId = req.user.userId;
  if (parseInt(userId) !== authenticatedUserId) {
    return res.sendStatus(403);
  }
  try {
    const ordersResult = await pool.query(
      `SELECT o.*, 
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
        (SELECT COALESCE(SUM(oi.price * oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS total
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );
    res.json(ordersResult.rows);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
});

// Get all orders (admin, with pagination, status, payment type, and date filters)
app.get("/api/orders", authenticateToken, async (req, res) => {
  if (!req.user || !req.user.is_admin) {
    return res.sendStatus(403); // Forbidden if not an admin
  }

  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = parseInt(req.query.offset, 10) || 0;
  const { status, payment_type, start_date, end_date } = req.query;

  let whereClauses = [];
  let queryParams = [];
  let paramIndex = 1;

  if (status && status !== "all") {
    whereClauses.push(`o.status = $${paramIndex++}`);
    queryParams.push(status);
  }

  if (payment_type && payment_type !== "all") {
    whereClauses.push(`o.payment_type = $${paramIndex++}`);
    queryParams.push(payment_type);
  }

  if (start_date) {
    whereClauses.push(`o.created_at >= $${paramIndex++}::date`);
    queryParams.push(start_date);
  }

  if (end_date) {
    whereClauses.push(
      `o.created_at < ($${paramIndex++}::date + interval '1 day')`
    );
    queryParams.push(end_date);
  }

  const where = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const dataQueryParams = [...queryParams, limit, offset];
  const countQueryParams = [...queryParams];

  try {
    const ordersResult = await pool.query(
      `SELECT o.*, u.username, c.name AS customer_name,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
        (SELECT COALESCE(SUM(oi.price * oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS total
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN customers c ON o.user_id = c.user_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      dataQueryParams
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders o ${where}`,
      countQueryParams
    );

    res.json({
      orders: ordersResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Update order status (admin)
app.put("/api/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    // Fetch user_id before updating status
    const orderResult = await pool.query(
      "SELECT user_id FROM orders WHERE id = $1",
      [id]
    );
    const userId = orderResult.rows[0]?.user_id;

    await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [
      status,
      id,
    ]);

    // Insert notification for the customer if user_id is found
    if (userId) {
      // Store a notification type and a simple message key instead of the full message
      const notificationType = "order_status_update";
      const notificationMessageKey = "notification.order_status_update"; // Use a key for translation
      await pool.query(
        "INSERT INTO notifications (user_id, type, order_id, message, is_read) VALUES ($1, $2, $3, $4, false)",
        [userId, notificationType, id, notificationMessageKey]
      ); // Pass type and message key
    }

    res.json({ message: "Order status updated" });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Admin dashboard stats endpoint
app.get("/api/admin/stats", async (req, res) => {
  try {
    const totalOrdersResult = await pool.query("SELECT COUNT(*) FROM orders");
    const totalSalesResult = await pool.query(
      "SELECT COALESCE(SUM(total::numeric), 0) FROM orders WHERE status = 'completed'"
    );
    const totalCustomersResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE is_admin = false"
    );
    const totalProductsResult = await pool.query(
      "SELECT COUNT(*) FROM products"
    );
    const pendingOrdersResult = await pool.query(
      "SELECT COUNT(*) FROM orders WHERE status = 'pending'"
    );
    res.json({
      totalOrders: parseInt(totalOrdersResult.rows[0].count, 10),
      totalSales: parseFloat(totalSalesResult.rows[0].coalesce),
      totalCustomers: parseInt(totalCustomersResult.rows[0].count, 10),
      totalProducts: parseInt(totalProductsResult.rows[0].count, 10),
      pendingOrders: parseInt(pendingOrdersResult.rows[0].count, 10),
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// Sales analytics endpoint (sales per period for completed orders)
app.get("/api/admin/sales-analytics", async (req, res) => {
  try {
    const group = req.query.group || "month";
    const start = req.query.start;
    const end = req.query.end;
    const status = req.query.status || "completed"; // Status filter was removed from frontend, but keeping backend logic for flexibility
    const paymentType = req.query.payment_type; // Payment type filter was removed from frontend, but keeping backend logic for flexibility

    const tz = "Asia/Bangkok"; // Set your local timezone
    let groupBy;
    // Correctly handle timestamptz by converting to target timezone before formatting
    if (group === "day") {
      groupBy = `TO_CHAR(created_at AT TIME ZONE '${tz}', 'YYYY-MM-DD')`;
    } else if (group === "week") {
      groupBy = `TO_CHAR(created_at AT TIME ZONE '${tz}', 'IYYY-IW')`;
    } else if (group === "year") {
      groupBy = `TO_CHAR(created_at AT TIME ZONE '${tz}', 'YYYY')`;
    } else {
      // Default to month
      groupBy = `TO_CHAR(created_at AT TIME ZONE '${tz}', 'YYYY-MM')`;
    }

    let whereClauses = [
      /* Removed status filter */ "status = 'completed'" /* Keeping for now as frontend doesn't send status */,
    ];
    let params = [];
    let paramIndex = 1;

    // Re-add status and payment type to where clauses if provided (though frontend currently doesn't send them)
    if (status && status !== "completed") {
      // Only add if status is explicitly sent and not the default
      whereClauses.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (paymentType) {
      whereClauses.push(`payment_type = $${paramIndex++}`);
      params.push(paymentType);
    }

    // Adjust start and end date filtering to compare against created_at in the target timezone
    if (start) {
      whereClauses.push(
        `created_at AT TIME ZONE '${tz}' >= $${paramIndex++}::date`
      );
      params.push(start);
    }
    if (end) {
      // For the end date, filter up to the end of the day
      whereClauses.push(
        `created_at AT TIME ZONE '${tz}' < ($${paramIndex++}::date + interval '1 day')`
      );
      params.push(end);
    }

    const where = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    const result = await pool.query(
      `SELECT ${groupBy} AS period, COALESCE(SUM(total::numeric), 0) AS total
       FROM orders
       ${where}
       GROUP BY period
       ORDER BY period`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching sales analytics:", err);
    res.status(500).json({ error: "Failed to fetch sales analytics" });
  }
});

// Top selling products endpoint
app.get("/api/admin/top-selling-products", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, SUM(oi.quantity) AS total_quantity, SUM(oi.quantity * oi.price) AS total_sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'completed'
      GROUP BY p.id, p.name
      ORDER BY total_quantity DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching top selling products:", err);
    res.status(500).json({ error: "Failed to fetch top selling products" });
  }
});

// Customer management endpoint (with pagination and search)
app.get("/api/admin/customers", authenticateToken, async (req, res) => {
  // Check if the authenticated user is an admin
  if (!req.user || !req.user.is_admin) {
    return res.sendStatus(403); // Forbidden if not an admin
  }

  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = parseInt(req.query.offset, 10) || 0;
  const searchTerm = req.query.query; // Get the search term from query parameters

  let whereClauses = [];
  let whereParams = [];
  let paramIndex = 1;

  // Add search term clause for username or email
  if (searchTerm) {
    whereClauses.push(
      `(u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex + 1})`
    );
    whereParams.push(`%${searchTerm}%`);
    whereParams.push(`%${searchTerm}%`);
    paramIndex += 2; // Increment paramIndex by 2 for the two placeholders
  }

  const where = whereClauses.length
    ? `WHERE u.is_admin = false AND ${whereClauses.join(" AND ")}` // Filter for non-admin users and apply search clauses
    : `WHERE u.is_admin = false`; // Default filter for non-admin users

  const dataQueryParams = [...whereParams, limit, offset];

  try {
    const dataResult = await pool.query(
      `
      SELECT u.id, u.username, u.email, u.created_at, u.status,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
        (SELECT COALESCE(SUM(total::numeric), 0) FROM orders o WHERE o.user_id = u.id AND o.status = 'completed') AS total_spent,
        c.name as customer_name, -- Include customer name
        c.phone as phone_number, -- Include customer phone number
        c.address as address, -- Include customer address
        u.is_admin -- Include is_admin status
      FROM users u
      LEFT JOIN customers c ON u.id = c.user_id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `,
      dataQueryParams
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users u ${where.replace(
        "u.is_admin = false AND ",
        ""
      )}`, // Count only non-admin users matching search
      whereParams // Use only whereParams for the count query
    );

    res.json({
      customers: dataResult.rows, // Still return as 'customers' for frontend compatibility
      total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Add endpoint to update user status (admin)
app.put("/api/admin/customers/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query("UPDATE users SET status = $1 WHERE id = $2", [
      status,
      id,
    ]);
    res.json({ message: "User status updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user status" });
  }
});

// New endpoint for Admin to update any user's details (username, email, is_admin)
app.put("/api/admin/users/:id", authenticateToken, async (req, res) => {
  // Check if the authenticated user is an admin
  if (!req.user || !req.user.is_admin) {
    return res.sendStatus(403); // Forbidden if not an admin
  }

  const { id } = req.params; // User ID to update from URL
  const { username, email, is_admin, status } = req.body; // Fields to update

  // Basic validation (ensure at least one field to update is provided)
  if (
    username === undefined &&
    email === undefined &&
    is_admin === undefined &&
    status === undefined
  ) {
    return res.status(400).json({ error: "No update data provided." });
  }

  try {
    // Build the SET clause for the SQL query dynamically based on provided fields
    const updateFields = [];
    const queryParams = [id]; // Start with user ID
    let paramIndex = 2; // Start index for other parameters

    if (username !== undefined) {
      // Optional: Add username format and uniqueness validation here
      updateFields.push(`username = $${paramIndex++}`);
      queryParams.push(username);
    }
    if (email !== undefined) {
      // Optional: Add email format and uniqueness validation here
      updateFields.push(`email = $${paramIndex++}`);
      queryParams.push(email);
    }
    if (is_admin !== undefined) {
      updateFields.push(`is_admin = $${paramIndex++}`);
      queryParams.push(is_admin);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update." });
    }

    const query = `UPDATE users SET ${updateFields.join(
      ", "
    )} WHERE id = $1 RETURNING id, username, email, is_admin, status`;

    const result = await pool.query(query, queryParams);

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]); // Return the updated user
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error(`Error updating user with ID ${id}:`, err);
    // Check for unique constraint violation on email or username
    if (err.code === "23505") {
      // PostgreSQL unique violation error code
      const detail = err.detail || err.message;
      if (detail.includes("email")) {
        return res.status(409).json({ error: "Email already exists." });
      } else if (detail.includes("username")) {
        return res.status(409).json({ error: "Username already exists." });
      } else {
        return res.status(409).json({ error: "Duplicate key error." });
      }
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to delete a user by ID (Admin only)
app.delete("/api/users/:id", authenticateToken, async (req, res) => {
  // Check if the authenticated user is an admin
  if (!req.user || !req.user.is_admin) {
    return res.sendStatus(403); // Forbidden if not an admin
  }

  const { id } = req.params; // User ID from URL

  try {
    // Consider deleting related data (orders, cart items, etc.) first
    // or ensure your database schema handles cascading deletes.
    // Example: Delete user's orders (if necessary and not cascading)
    // await pool.query('DELETE FROM orders WHERE user_id = $1', [id]);
    // Example: Delete user's cart items (if necessary and not cascading)
    // await pool.query('DELETE FROM cart_items WHERE user_id = $1', [id]);

    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    console.error(`Error deleting user with ID ${id}:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete an order (admin only)
app.delete("/api/orders/:id", authenticateToken, async (req, res) => {
  if (!req.user || !req.user.is_admin) {
    return res.sendStatus(403); // Forbidden if not an admin
  }
  const { id } = req.params;

  const client = await pool.connect(); // Get a client for the transaction
  try {
    await client.query("BEGIN"); // Start transaction

    // 1. Delete associated notifications
    await client.query("DELETE FROM notifications WHERE order_id = $1", [id]);

    // 2. Delete order items first (to maintain referential integrity)
    await client.query("DELETE FROM order_items WHERE order_id = $1", [id]);

    // 3. Then delete the order
    const result = await client.query(
      "DELETE FROM orders WHERE id = $1 RETURNING id",
      [id]
    );

    await client.query("COMMIT"); // Commit the transaction

    if (result.rows.length > 0) {
      res.status(200).json({ message: "Order deleted successfully" });
    } else {
      res.status(404).json({ error: "Order not found" });
    }
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback transaction on error
    console.error(`Error deleting order with ID ${id}:`, err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release(); // Release the client back to the pool
  }
});

// Category Image Upload Endpoint (Admin only)
app.post("/api/upload", async (req, res) => {
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

// Get user profile
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    // The authenticateToken middleware attaches user info to req.user
    const userId = req.user.userId;

    // Fetch user data and join with customer data
    const result = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.is_admin,
         c.name AS customer_name,
         c.phone AS customer_phone,
         c.address AS customer_address
       FROM users u
       LEFT JOIN customers c ON u.id = c.user_id
       WHERE u.id = $1`,
      [userId]
    );

    const userProfile = result.rows[0];

    if (!userProfile) {
      // This should theoretically not happen if authenticateToken succeeds
      return res.status(404).json({ error: "User profile not found" });
    }

    // Restructure the response to match frontend expectation (user.customer)
    const formattedProfile = {
      id: userProfile.id,
      username: userProfile.username,
      email: userProfile.email,
      is_admin: userProfile.is_admin,
      customer: {
        name: userProfile.customer_name,
        phone: userProfile.customer_phone,
        address: userProfile.customer_address,
      },
    };

    res.json(formattedProfile);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add endpoint to update user profile
app.put("/api/profile", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Get user ID from authenticated token
  const { username, email, name, phone, address } = req.body;

  // Basic validation (at least one field should be provided)
  if (!username && !email && !name && !phone && !address) {
    return res.status(400).json({ error: "No update data provided." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Update users table (if username or email are provided)
    const userUpdateFields = [];
    const userUpdateParams = [userId];
    let userParamIndex = 2;

    if (username) {
      userUpdateFields.push(`username = $${userParamIndex++}`);
      userUpdateParams.push(username);
    }
    if (email) {
      // Optional: Add email format validation here if not done on frontend
      // Optional: Check for unique email constraint violation more gracefully
      userUpdateFields.push(`email = $${userParamIndex++}`);
      userUpdateParams.push(email);
    }

    if (userUpdateFields.length > 0) {
      const userUpdateQuery = `UPDATE users SET ${userUpdateFields.join(
        ", "
      )} WHERE id = $1`;
      await client.query(userUpdateQuery, userUpdateParams);
    }

    // Handle customers table (insert or update)
    // Check if customer record exists for this user
    const customerExistsResult = await client.query(
      "SELECT id FROM customers WHERE user_id = $1",
      [userId]
    );
    const customerExists = customerExistsResult.rows.length > 0;

    if (customerExists) {
      // Update existing customer record
      const customerUpdateFields = [];
      const customerUpdateParams = [userId];
      let customerParamIndex = 2;

      if (name !== undefined) {
        // Use undefined check to allow setting to empty string
        customerUpdateFields.push(`name = $${customerParamIndex++}`);
        customerUpdateParams.push(name);
      }
      if (phone !== undefined) {
        customerUpdateFields.push(`phone = $${customerParamIndex++}`);
        customerUpdateParams.push(phone);
      }
      if (address !== undefined) {
        customerUpdateFields.push(`address = $${customerParamIndex++}`);
        customerUpdateParams.push(address);
      }

      // Add email to customer update if provided
      if (email !== undefined) {
        customerUpdateFields.push(`email = $${customerParamIndex++}`);
        customerUpdateParams.push(email);
      }

      if (customerUpdateFields.length > 0) {
        const customerUpdateQuery = `UPDATE customers SET ${customerUpdateFields.join(
          ", "
        )} WHERE user_id = $1`;
        await client.query(customerUpdateQuery, customerUpdateParams);
      }
    } else {
      // Create new customer record if it doesn't exist and at least one customer field is provided
      // Include email in the insert if provided
      if (name || phone || address || email) {
        await client.query(
          "INSERT INTO customers (user_id, name, phone, address, email) VALUES ($1, $2, $3, $4, $5)",
          [userId, name || null, phone || null, address || null, email || null]
        );
      }
    }

    await client.query("COMMIT");
    // Fetch and return the updated user profile
    const updatedUserResult = await client.query(
      `SELECT
         u.id,
         u.username,
         u.email,
         u.is_admin,
         c.name AS customer_name,
         c.phone AS customer_phone,
         c.address AS customer_address
       FROM users u
       LEFT JOIN customers c ON u.id = c.user_id
       WHERE u.id = $1`,
      [userId]
    );
    const updatedUserProfile = updatedUserResult.rows[0];

    if (updatedUserProfile) {
      // Restructure the response to match frontend expectation (user.customer)
      const formattedProfile = {
        id: updatedUserProfile.id,
        username: updatedUserProfile.username,
        email: updatedUserProfile.email,
        is_admin: updatedUserProfile.is_admin,
        customer: {
          name: updatedUserProfile.customer_name,
          phone: updatedUserProfile.customer_phone,
          address: updatedUserProfile.customer_address,
        },
      };
      res.status(200).json(formattedProfile);
    } else {
      // Should not happen if update was successful
      res.status(500).json({ error: "Failed to retrieve updated profile" });
    }
  } catch (err) {
    await client.query("ROLLBACK"); // Rollback transaction on error
    console.error("Error updating user profile:", err);
    // Check for unique constraint violation on email
    if (err.code === "23505") {
      // PostgreSQL unique violation error code
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// Add endpoint to change user password
app.put("/api/change-password", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Get user ID from authenticated token
  const { currentPassword, newPassword } = req.body;

  // Basic validation
  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Current and new passwords are required" });
  }

  try {
    // Fetch the user's current hashed password
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );
    const user = result.rows[0];

    if (!user) {
      // This should not happen if authenticateToken works correctly
      return res.status(404).json({ error: "User not found" });
    }

    // Compare the provided current password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid current password" });
    }

    // Hash the new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update the password in the users table
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      newPasswordHash,
      userId,
    ]);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// New endpoint to get notifications (Admin only)
app.get("/api/notifications", authenticateToken, async (req, res) => {
  // Check if the authenticated user is an admin
  if (!req.user || !req.user.is_admin) {
    return res.sendStatus(403); // Forbidden if not an admin
  }

  try {
    // Fetch all notifications intended for admins (where user_id is null), ordered by creation date
    const result = await pool.query(
      "SELECT id, type, order_id, message, is_read, created_at FROM notifications WHERE user_id IS NULL ORDER BY created_at DESC"
    ); // Added WHERE user_id IS NULL
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// New endpoint to mark a notification as read (Admin only)
app.put("/api/notifications/:id/read", authenticateToken, async (req, res) => {
  // Check if the authenticated user is an admin
  if (!req.user || !req.user.is_admin) {
    return res.sendStatus(403); // Forbidden if not an admin
  }

  const { id } = req.params; // Notification ID from URL

  try {
    const result = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ message: "Notification marked as read" });
    } else {
      res.status(404).json({ error: "Notification not found" });
    }
  } catch (err) {
    console.error(`Error marking notification ${id} as read:`, err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// New endpoint to get notifications for a specific user (customer)
app.get(
  "/api/notifications/user/:userId",
  authenticateToken,
  async (req, res) => {
    const { userId } = req.params;
    const authenticatedUserId = req.user.userId;

    // Ensure the authenticated user is requesting their own notifications
    if (parseInt(userId) !== authenticatedUserId) {
      return res.sendStatus(403); // Forbidden
    }

    try {
      // Fetch notifications for the authenticated user, ordered by creation date
      // Join with orders table to get the order status
      const result = await pool.query(
        "SELECT n.id, n.type, n.order_id, n.message, n.is_read, n.created_at, o.status as order_status FROM notifications n JOIN orders o ON n.order_id = o.id WHERE n.user_id = $1 ORDER BY n.created_at DESC", // Join with orders and select order_status
        [authenticatedUserId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(`Error fetching notifications for user ${userId}:`, err);
      res.status(500).json({ error: "Failed to fetch user notifications" });
    }
  }
);

// New endpoint to mark a notification as read for a specific user (customer)
app.put(
  "/api/notifications/user/:notificationId/read",
  authenticateToken,
  async (req, res) => {
    const { notificationId } = req.params;
    const authenticatedUserId = req.user.userId;

    try {
      // Fetch the notification to ensure it belongs to the authenticated user
      const notificationResult = await pool.query(
        "SELECT user_id FROM notifications WHERE id = $1",
        [notificationId]
      );

      if (notificationResult.rows.length === 0) {
        return res.status(404).json({ error: "Notification not found" });
      }

      const notificationUserId = notificationResult.rows[0].user_id;

      // Ensure the authenticated user owns the notification they are trying to mark as read
      if (notificationUserId !== authenticatedUserId) {
        return res.sendStatus(403); // Forbidden
      }

      // Mark the notification as read
      const result = await pool.query(
        "UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING id",
        [notificationId]
      );

      if (result.rows.length > 0) {
        res.status(200).json({ message: "Notification marked as read" });
      } else {
        // Should not happen if the previous check passed
        res.status(500).json({ error: "Failed to mark notification as read" });
      }
    } catch (err) {
      console.error(
        `Error marking notification ${notificationId} as read for user ${authenticatedUserId}:`,
        err
      );
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  }
);

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
