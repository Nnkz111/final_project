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
    cb(null, "uploads/"); // Save uploaded files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    // Use the original file extension
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
      { expiresIn: "1h" }
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
    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
      expiresIn: "1h",
    }); // Token expires in 1 hour

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        is_admin: user.is_admin,
      },
    }); // Return token and basic user info
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
