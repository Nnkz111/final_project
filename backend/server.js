// Import the express library
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const multer = require("multer"); // Import multer
const path = require("path"); // Import path module
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Create an Express application
const app = express();

// Use cors middleware to allow cross-origin requests
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // If uploading payment proof, store in uploads/payment_proof
    if (req.originalUrl.startsWith("/api/orders")) {
      cb(null, "uploads/payment_proof/");
    } else {
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

// Add a new product with image upload
app.post("/api/products", upload.single("productImage"), async (req, res) => {
  const { name, description, price, stock_quantity } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Get the uploaded image path

  // Basic validation
  if (!name || !price || !stock_quantity) {
    return res
      .status(400)
      .json({ error: "Name, price, and stock_quantity are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO products (name, description, price, stock_quantity, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, description, price, stock_quantity, imageUrl]
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
app.put(
  "/api/products/:id",
  authenticateToken,
  upload.single("productImage"),
  async (req, res) => {
    // Check if the authenticated user is an admin
    if (!req.user || !req.user.is_admin) {
      return res.sendStatus(403); // Forbidden if not an admin
    }

    const { id } = req.params; // Get the product ID from the URL
    const { name, description, price, stock_quantity } = req.body;
    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.image_url; // Use new image or existing image URL

    // Basic validation (ensure at least one field to update is provided)
    if (!name && !description && !price && !stock_quantity && !imageUrl) {
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
  }
);

// Category routes
// Endpoint to get all categories
app.get("/api/categories", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, parent_id FROM categories"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to add a new category (Admin only)
app.post("/api/categories", authenticateToken, async (req, res) => {
  // Check if the authenticated user is an admin
  if (!req.user || !req.user.is_admin) {
    return res.sendStatus(403); // Forbidden if not an admin
  }

  const { name, parent_id } = req.body;

  // Basic validation
  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO categories (name, parent_id) VALUES ($1, $2) RETURNING id, name, parent_id",
      [name, parent_id || null] // Use null for parent_id if not provided
    );
    res.status(201).json(result.rows[0]); // Return the newly created category
  } catch (err) {
    console.error("Error adding new category:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to update a category by ID (Admin only)
app.put("/api/categories/:id", authenticateToken, async (req, res) => {
  // Check if the authenticated user is an admin
  if (!req.user || !req.user.is_admin) {
    return res.sendStatus(403); // Forbidden if not an admin
  }

  const { id } = req.params; // Category ID from URL
  const { name, parent_id } = req.body; // Updated data

  // Basic validation
  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  try {
    const result = await pool.query(
      "UPDATE categories SET name = $1, parent_id = $2 WHERE id = $3 RETURNING id, name, parent_id",
      [name, parent_id || null, id] // Use null for parent_id if not provided
    );

    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]); // Return the updated category
    } else {
      res.status(404).json({ error: "Category not found" });
    }
  } catch (err) {
    console.error(`Error updating category with ID ${id}:`, err);
    res.status(500).json({ error: "Internal server error" });
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
    const result = await pool.query(
      "SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image_url FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = $1",
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

  // No need to check userId in body against authenticatedUserId here,
  // as we will directly use authenticatedUserId for the database operation.
  // Basic validation for productId and quantity remains.

  if (!productId) {
    // Only check productId and quantity
    return res.status(400).json({ error: "productId is required" });
  }
  // Quantity validation is already present

  try {
    // Check if the item already exists for the authenticated user
    const existingItem = await pool.query(
      "SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2",
      [authenticatedUserId, productId]
    );

    if (existingItem.rows.length > 0) {
      // If item exists, update the quantity for the authenticated user
      const updatedQuantity = existingItem.rows[0].quantity + quantity;
      await pool.query(
        "UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3",
        [updatedQuantity, authenticatedUserId, productId]
      );
      res.status(200).json({ message: "Cart item quantity updated" });
    } else {
      // If item doesn't exist, insert a new item for the authenticated user
      await pool.query(
        "INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)",
        [authenticatedUserId, productId, quantity]
      );
      res.status(201).json({ message: "Product added to cart" });
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
    // First, get the user_id of the cart item to ensure the authenticated user owns it
    const cartItemResult = await pool.query(
      "SELECT user_id FROM cart_items WHERE id = $1",
      [cartItemId]
    );
    if (cartItemResult.rows.length === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    const cartItemUserId = cartItemResult.rows[0].user_id;

    // Ensure the authenticated user owns the cart item they are trying to update
    if (cartItemUserId !== authenticatedUserId) {
      return res.sendStatus(403); // Forbidden
    }

    // Update the cart item quantity since the user is authorized
    const result = await pool.query(
      "UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING id",
      [quantity, cartItemId]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ message: "Cart item quantity updated" });
    } else {
      // This case should ideally not be reached if the previous check passed,
      // but included for robustness.
      res
        .status(404)
        .json({ error: "Cart item not found after authorization check" });
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
const jwtSecret =
  "ac4032c29c623d530ef35a38f4d05b736a88ba9aa7d43f5a9d179eced08260f764855cb16fa77b5ed611396a70ccbad5ad61628ea6c9a37244c73900f2216c55909e9b4833400ed637dd6d787b99b3d8f5b0e4c2408dec7e9883b2012d75444626bc8a8c4d74cae0a3f169cb9817894f5c5872baeb9514ba42cd030909313d49"; // TODO: Replace with a strong, secure key

// Middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Get token from 'Bearer TOKEN' format

  if (token == null) {
    return res.sendStatus(401); // If there is no token, return unauthorized
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.sendStatus(403); // If token is invalid, return forbidden
    }
    req.user = user; // Attach user information to the request
    next(); // Proceed to the next middleware or route handler
  });
}

// User Authentication Routes

// Register a new user
app.post("/api/auth/register", async (req, res) => {
  const { email, password, username } = req.body; // Assuming username is also provided

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

    // Hash the password
    const saltRounds = 10; // Cost factor for hashing
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the database
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, username, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, email, username, is_admin",
      [email, passwordHash, username, false] // Include is_admin in the insert statement and values
    );

    const newUser = result.rows[0];

    // Create a JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, is_admin: newUser.is_admin }, // Include is_admin in the token payload
      jwtSecret,
      { expiresIn: "2d" }
    ); // Token expires in 1 hour

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        is_admin: newUser.is_admin, // Include is_admin in the returned user object
      },
    }); // Return token and basic user info
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
    // Find the user by email or username
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
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
    const token = jwt.sign(
      { userId: user.id, email: user.email, is_admin: user.is_admin }, // Include is_admin here
      jwtSecret,
      { expiresIn: "2d" }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        is_admin: user.is_admin, // And include it here
      },
    }); // Return token and basic user info
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Place this after cart routes, before app.listen
const uploadOrderProof = multer({ storage: storage });
app.post(
  "/api/orders",
  uploadOrderProof.single("payment_proof"),
  async (req, res) => {
    try {
      // Parse fields from FormData
      const userId = req.body.userId;
      const items = JSON.parse(req.body.items);
      const shipping = JSON.parse(req.body.shipping);
      const payment_type = req.body.payment_type;
      const payment_proof = req.file
        ? `/uploads/payment_proof/${req.file.filename}`
        : null;

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
    // Ensure payment_proof is a relative path
    if (order.payment_proof && !order.payment_proof.startsWith("/uploads/")) {
      order.payment_proof = `/uploads/payment_proof/${order.payment_proof}`;
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

// Get all orders (admin)
app.get("/api/orders", async (req, res) => {
  try {
    const ordersResult = await pool.query(
      `SELECT o.*, u.username, 
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
        (SELECT COALESCE(SUM(oi.price * oi.quantity), 0) FROM order_items oi WHERE oi.order_id = o.id) AS total
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json(ordersResult.rows);
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
    await pool.query("UPDATE orders SET status = $1 WHERE id = $2", [
      status,
      id,
    ]);
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
    const totalCustomersResult = await pool.query("SELECT COUNT(*) FROM users");
    const totalProductsResult = await pool.query(
      "SELECT COUNT(*) FROM products"
    );
    res.json({
      totalOrders: parseInt(totalOrdersResult.rows[0].count, 10),
      totalSales: parseFloat(totalSalesResult.rows[0].coalesce),
      totalCustomers: parseInt(totalCustomersResult.rows[0].count, 10),
      totalProducts: parseInt(totalProductsResult.rows[0].count, 10),
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
    const status = req.query.status || "completed";
    const paymentType = req.query.payment_type;

    const tz = "Asia/Bangkok"; // Set your local timezone
    let groupBy;
    if (group === "day") {
      groupBy = `TO_CHAR(created_at AT TIME ZONE '${tz}', 'YYYY-MM-DD')`;
    } else if (group === "week") {
      groupBy = `TO_CHAR(created_at AT TIME ZONE '${tz}', 'IYYY-IW')`;
    } else if (group === "year") {
      groupBy = `TO_CHAR(created_at AT TIME ZONE '${tz}', 'YYYY')`;
    } else {
      groupBy = `TO_CHAR(created_at AT TIME ZONE '${tz}', 'YYYY-MM')`;
    }

    let whereClauses = ["status = $1"];
    let params = [status];
    let paramIndex = 2;
    if (start) {
      whereClauses.push(`created_at >= $${paramIndex++}`);
      params.push(start);
    }
    if (end) {
      whereClauses.push(`created_at <= $${paramIndex++}`);
      params.push(end);
    }
    if (paymentType) {
      whereClauses.push(`payment_type = $${paramIndex++}`);
      params.push(paymentType);
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

// Customer management endpoint
app.get("/api/admin/customers", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.created_at,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
        (SELECT COALESCE(SUM(total::numeric), 0) FROM orders o WHERE o.user_id = u.id AND o.status = 'completed') AS total_spent
      FROM users u
      WHERE u.is_admin = false
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
