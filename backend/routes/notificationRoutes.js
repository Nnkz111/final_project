const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // Import the database pool
const authenticateToken = require("../middleware/authMiddleware"); // Import authentication middleware
const { param, validationResult } = require("express-validator"); // Import param and validationResult

// New endpoint to get notifications (Admin only)
router.get("/", authenticateToken, async (req, res) => {
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
router.put(
  "/:id/read",
  authenticateToken,
  [param("id").isInt().withMessage("Notification ID must be an integer")],
  async (req, res) => {
    // Check if the authenticated user is an admin
    if (!req.user || !req.user.is_admin) {
      return res.sendStatus(403); // Forbidden if not an admin
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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
  }
);

// New endpoint to get notifications for a specific user (customer)
router.get(
  "/user/:userId",
  authenticateToken,
  [param("userId").isInt().withMessage("User ID must be an integer")],
  async (req, res) => {
    const { userId } = req.params;
    const authenticatedUserId = req.user.userId;

    // Ensure the authenticated user is requesting their own notifications
    if (parseInt(userId) !== authenticatedUserId) {
      return res.sendStatus(403); // Forbidden
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
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
router.put(
  "/user/:notificationId/read",
  authenticateToken,
  [
    param("notificationId")
      .isInt()
      .withMessage("Notification ID must be an integer"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
