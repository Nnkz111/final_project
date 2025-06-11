const express = require("express");

const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator"); // Import body and validationResult
const pool = require("../config/db"); // Import the database pool
const authenticateToken = require("../middleware/authMiddleware");

// Secret key for JWT (should be stored securely, e.g., in environment variables)
const jwtSecret = process.env.JWT_SECRET; // Use environment variable for JWT secret

// Register a new user
router.post(
  "/register",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail()
      .notEmpty()
      .withMessage("Email is required"),
    body("username").trim().notEmpty().withMessage("Username is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("name").trim().notEmpty().withMessage("Name is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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
  }
);

// Login user
router.post(
  "/login",
  [
    body("password").notEmpty().withMessage("Password is required"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail(),
    body("username").optional().trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, username } = req.body;

    // Ensure either email or username is provided
    if (!email && !username) {
      return res
        .status(400)
        .json({ error: "Email or username is required for login" });
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
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );

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
  }
);

// Change user password
router.put(
  "/change-password",
  authenticateToken,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId; // Get userId from authenticated token

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    try {
      // Fetch user's current hashed password from the database
      const userResult = await pool.query(
        "SELECT password_hash FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const storedHash = userResult.rows[0].password_hash;

      // Compare current password with stored hash
      const isPasswordValid = await bcrypt.compare(currentPassword, storedHash);

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid current password" });
      }

      // Hash the new password
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update the password in the database
      await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
        newPasswordHash,
        userId,
      ]);

      res.status(200).json({ message: "Password changed successfully" });
    } catch (err) {
      console.error("Error changing password:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get user profile (requires authentication)
router.get("/profile", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Get userId from authenticated token

  try {
    // Fetch user details and join with customer information
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
      return res.status(404).json({ error: "User profile not found" });
    }
    const formattedUserProfile = {
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

    console.log(
      "Backend: Formatted user profile data being sent",
      formattedUserProfile
    );
    res.status(200).json(formattedUserProfile);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile (requires authentication)
/*
router.put("/profile", authenticateToken, async (req, res) => {
  const userId = req.user.userId; // Get userId from authenticated token
  const { email, name, phone, address } = req.body;

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update user email
      await client.query("UPDATE users SET email = $1 WHERE id = $2", [
        email,
        userId,
      ]);

      // Update or insert customer details
      const customerResult = await client.query(
        "SELECT id FROM customers WHERE user_id = $1",
        [userId]
      );

      if (customerResult.rows.length > 0) {
        // Customer exists, update
        await client.query(
          "UPDATE customers SET name = $1, phone = $2, address = $3 WHERE user_id = $4",
          [name, phone, address, userId]
        );
      } else {
        // Customer does not exist, insert new customer
        await client.query(
          "INSERT INTO customers (user_id, name, phone, address) VALUES ($1, $2, $3, $4)",
          [userId, name, phone, address]
        );
      }

      await client.query("COMMIT");

      // Fetch and return the updated user profile
      const updatedProfileResult = await pool.query(
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
      res.status(200).json(updatedProfileResult.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
*/

module.exports = router;
