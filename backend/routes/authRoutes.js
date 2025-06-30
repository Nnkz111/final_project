const express = require("express");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

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
          "INSERT INTO users (email, password_hash, username, role) VALUES ($1, $2, $3, $4) RETURNING id, email, username, role",
          [email, passwordHash, username, "customer"]
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
            role: newUser.role,
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
            role: newUser.role,
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
           u.role,
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
        role: user.role,
      };

      const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: "2d" });

      res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
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
                 u.role,
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
      role: userProfile.role,
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

// Forgot Password - Customer
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    // Check if user exists and is not admin
    const userResult = await pool.query(
      "SELECT id, email, role FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];
    if (!user || user.role === "admin") {
      // Do not reveal if user exists for security
      return res
        .status(200)
        .json({ message: "If this email exists, a reset link has been sent." });
    }
    // Generate token and expiry (1 hour)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    // Store hash and expiry in users table (add columns if needed)
    await pool.query(
      "UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3",
      [resetTokenHash, resetTokenExpiry, user.id]
    );
    // Send email using Resend
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    const subject = "Password Reset Request";
    const html = `<p>Hello,</p><p>You requested a password reset. Click the link below to set a new password. This link will expire in 1 hour.</p><p><a href='${resetUrl}'>Reset Password</a></p><p>If you did not request this, you can ignore this email.</p>`;
    await sendEmail(email, subject, html);
    return res
      .status(200)
      .json({ message: "If this email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Reset Password - Customer
router.post("/reset-password", async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    // Find user by email
    const userResult = await pool.query(
      "SELECT id, reset_password_token, reset_password_expires FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];
    if (!user || !user.reset_password_token || !user.reset_password_expires) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    // Hash the provided token and compare
    const tokenHash = require("crypto")
      .createHash("sha256")
      .update(token)
      .digest("hex");
    if (
      user.reset_password_token !== tokenHash ||
      new Date(user.reset_password_expires) < new Date()
    ) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    // Hash new password
    const bcrypt = require("bcrypt");
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    // Update password and clear reset token/expiry
    await pool.query(
      "UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2",
      [passwordHash, user.id]
    );
    return res
      .status(200)
      .json({ message: "Password has been reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
