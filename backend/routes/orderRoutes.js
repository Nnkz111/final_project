const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // Import the database pool
const cloudinary = require("../config/cloudinary"); // Import Cloudinary configuration
const authenticateToken = require("../middleware/authMiddleware"); // Import authentication middleware
const { body, param, validationResult } = require("express-validator"); // Import body, param, and validationResult
const adminMiddleware = require("../middleware/adminMiddleware"); // Import adminMiddleware

// Place this after cart routes, before app.listen
// Removed Multer middleware from order creation route
// const uploadOrderProof = multer({ storage: storage });
router.post(
  "/",
  (req, res, next) => {
    try {
      // Parse stringified JSON fields from FormData
      if (req.body.items && typeof req.body.items === "string") {
        req.body.items = JSON.parse(req.body.items);
      }
      if (req.body.shipping && typeof req.body.shipping === "string") {
        req.body.shipping = JSON.parse(req.body.shipping);
      }
      next();
    } catch (e) {
      return res.status(400).json({
        errors: [{ msg: "Invalid JSON format for items or shipping data." }],
      });
    }
  },
  // Removed uploadOrderProof.single("payment_proof"),
  [
    body("userId")
      .isInt()
      .withMessage("User ID must be an integer")
      .notEmpty()
      .withMessage("User ID is required"),
    body("items")
      .isArray({ min: 1 })
      .withMessage("Items must be a non-empty array"),
    body("items.*.product_id")
      .isInt()
      .withMessage("Product ID in items must be an integer"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity in items must be a positive integer"),
    body("items.*.price")
      .isFloat({ gt: 0 })
      .withMessage("Price in items must be a positive number"),
    body("shipping.name")
      .trim()
      .notEmpty()
      .withMessage("Shipping name is required")
      .isLength({ max: 255 })
      .withMessage("Shipping name cannot exceed 255 characters"),
    body("shipping.address")
      .trim()
      .notEmpty()
      .withMessage("Shipping address is required")
      .isLength({ max: 500 })
      .withMessage("Shipping address cannot exceed 500 characters"),
    body("shipping.phone")
      .trim()
      .notEmpty()
      .withMessage("Shipping phone is required")
      .isLength({ max: 50 })
      .withMessage("Shipping phone cannot exceed 50 characters"),
    body("shipping.email")
      .isEmail()
      .withMessage("Shipping email must be a valid email address")
      .normalizeEmail()
      .notEmpty()
      .withMessage("Shipping email is required")
      .isLength({ max: 255 })
      .withMessage("Shipping email cannot exceed 255 characters"),
    body("payment_type")
      .trim()
      .notEmpty()
      .withMessage("Payment type is required")
      .isLength({ max: 50 })
      .withMessage("Payment type cannot exceed 50 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error("Validation errors in order placement:", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Parse fields from FormData
      const userId = req.body.userId;
      const items = req.body.items;
      const shipping = req.body.shipping;
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
router.get("/:id", async (req, res) => {
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
router.get("/user/:userId", authenticateToken, async (req, res) => {
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
router.get("/", authenticateToken, async (req, res) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
    return res.sendStatus(403); // Forbidden if not an admin
  }

  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = parseInt(req.query.offset, 10) || 0;
  const { status, payment_type, start_date, end_date, search } = req.query;

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

  if (search) {
    const searchLower = `%${search.toLowerCase()}%`;
    whereClauses.push(
      `(CAST(o.id AS TEXT) ILIKE $${paramIndex++} OR LOWER(u.username) ILIKE $${paramIndex++})`
    );
    queryParams.push(searchLower, searchLower);
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
      [...queryParams, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN customers c ON o.user_id = c.user_id
       ${where}`,
      queryParams
    );

    res.json({
      orders: ordersResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update order status by ID (Admin only)
router.put(
  "/:id/status",
  authenticateToken,
  [
    param("id").isInt().withMessage("Order ID must be an integer"),
    body("status")
      .trim()
      .notEmpty()
      .withMessage("Status is required")
      .isIn(["pending", "paid", "shipped", "completed", "cancelled"])
      .withMessage("Invalid order status"),
  ],
  async (req, res) => {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
      return res.sendStatus(403);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error(
        "Validation errors in order status update:",
        errors.array()
      );
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    try {
      const result = await pool.query(
        `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
        [status, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Insert notification for status change (Customer Notification)
      const order = result.rows[0];
      if (order.user_id) {
        const notificationType = "order_status_update";
        const notificationMessage = "notification.order_status_update";
        await pool.query(
          "INSERT INTO notifications (user_id, type, order_id, message, is_read) VALUES ($1, $2, $3, $4, false)",
          [order.user_id, notificationType, order.id, notificationMessage]
        );
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error(`Error updating order ${id} status:`, err);
      res.status(500).json({ error: "Failed to update order status" });
    }
  }
);

// New endpoint to allow a customer to cancel their own pending order
router.put(
  "/:id/cancel",
  authenticateToken,
  [param("id").isInt().withMessage("Order ID must be an integer")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params; // Order ID
    const authenticatedUserId = req.user.userId; // User ID from the authenticated token

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Fetch the order to verify ownership and status
      const orderResult = await client.query(
        "SELECT user_id, status FROM orders WHERE id = $1 FOR UPDATE", // Use FOR UPDATE to lock the row
        [id]
      );

      if (orderResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orderResult.rows[0];

      // Check if the authenticated user owns this order, or if they are an admin
      if (order.user_id !== authenticatedUserId && !isAdmin) {
        await client.query("ROLLBACK");
        return res.sendStatus(403); // Forbidden if not owner and not admin
      }

      // Check if the order is still pending
      if (order.status !== "pending") {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "Order can only be cancelled if its status is 'pending'",
        });
      }

      // Update order status to 'cancelled'
      const updateOrderResult = await client.query(
        "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
        ["cancelled", id]
      );

      // Re-increment product stock quantities
      const orderItemsResult = await client.query(
        "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
        [id]
      );

      for (const item of orderItemsResult.rows) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2",
          [item.quantity, item.product_id]
        );
      }

      // Insert notification for admin about the cancelled order
      await client.query(
        "INSERT INTO notifications (type, order_id, message, user_id, is_read) VALUES ($1, $2, $3, NULL, FALSE)",
        ["order_cancelled", id, `ຄຳສັ່ງຊື້ເລກທີ ${id} ຖືກຍົກເລີກໂດຍລູກຄ້າ.`]
      );

      // Insert notification for customer about their cancelled order
      await client.query(
        "INSERT INTO notifications (user_id, type, order_id, message, is_read) VALUES ($1, $2, $3, $4, FALSE)",
        [
          authenticatedUserId,
          "order_cancelled_customer",
          id,
          `Your order ${id} has been successfully cancelled.`, // This can be translated later
        ]
      );

      await client.query("COMMIT");
      res.status(200).json(updateOrderResult.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Error cancelling order ${id}:`, err);
      res.status(500).json({ error: "Failed to cancel order" });
    } finally {
      client.release();
    }
  }
);

// Delete order by ID (Admin only)
router.delete(
  "/delete/:id",
  authenticateToken,
  adminMiddleware,
  async (req, res) => {
    // Only admin can delete orders
    if (!req.user || req.user.role !== "admin") {
      return res.sendStatus(403);
    }
    const { id } = req.params;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Delete related order items first
      await client.query("DELETE FROM order_items WHERE order_id = $1", [id]);

      // Delete related notifications second (to satisfy foreign key constraint)
      await client.query("DELETE FROM notifications WHERE order_id = $1", [id]);

      // Then delete the order itself
      const result = await client.query(
        "DELETE FROM orders WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Order not found" });
      }

      await client.query("COMMIT");
      res.status(200).json({ message: "Order deleted successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`Error deleting order ${id}:`, err);
      res.status(500).json({ error: "Failed to delete order" });
    } finally {
      client.release();
    }
  }
);

// Update full order details (Admin only, more comprehensive update)
router.put("/:id", authenticateToken, async (req, res) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { id } = req.params;
  const {
    shipping_name,
    shipping_address,
    shipping_phone,
    shipping_email,
    status,
    payment_type,
    payment_proof,
  } = req.body;

  // Construct the update query dynamically
  const fields = [];
  const params = [];
  let paramIndex = 1;

  if (shipping_name !== undefined)
    fields.push(`shipping_name = $${paramIndex++}`, params.push(shipping_name));
  if (shipping_address !== undefined)
    fields.push(
      `shipping_address = $${paramIndex++}`,
      params.push(shipping_address)
    );
  if (shipping_phone !== undefined)
    fields.push(
      `shipping_phone = $${paramIndex++}`,
      params.push(shipping_phone)
    );
  if (shipping_email !== undefined)
    fields.push(
      `shipping_email = $${paramIndex++}`,
      params.push(shipping_email)
    );
  if (status !== undefined)
    fields.push(`status = $${paramIndex++}`, params.push(status));
  if (payment_type !== undefined)
    fields.push(`payment_type = $${paramIndex++}`, params.push(payment_type));
  // payment_proof should be handled separately if it involves file uploads
  // For now, allow direct update if it's a URL string
  if (payment_proof !== undefined)
    fields.push(`payment_proof = $${paramIndex++}`, params.push(payment_proof));

  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  params.push(id); // Add order ID for WHERE clause

  try {
    const query = `UPDATE orders SET ${fields.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING *`;
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error updating order with ID ${id}:`, err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// New: Admin upload shipping bill to order
router.put("/:id/shipping-bill-upload", authenticateToken, async (req, res) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { id } = req.params; // Order ID

  if (
    !req.files ||
    Object.keys(req.files).length === 0 ||
    !req.files.shipping_bill
  ) {
    return res
      .status(400)
      .json({ error: "No file uploaded or file field is not 'shipping_bill'" });
  }

  const file = req.files.shipping_bill;

  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "shipping_bills", // Dedicated folder for shipping bills
      resource_type: "image", // Ensure it's treated as an image
    });

    const shippingBillUrl = result.url;

    const updateResult = await pool.query(
      "UPDATE orders SET shipping_bill_url = $1 WHERE id = $2 RETURNING *",
      [shippingBillUrl, id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Fetch the user_id for the order
    const orderUserResult = await pool.query(
      "SELECT user_id FROM orders WHERE id = $1",
      [id]
    );
    if (orderUserResult.rows.length > 0) {
      const userId = orderUserResult.rows[0].user_id;
      // Insert notification for customer about shipping bill upload
      await pool.query(
        "INSERT INTO notifications (user_id, type, order_id, message, is_read) VALUES ($1, $2, $3, $4, false)",
        [
          userId,
          "shipping_bill_uploaded",
          id,
          "notification.shipping_bill_uploaded",
        ]
      );
    }

    res.status(200).json({
      message: "Shipping bill uploaded successfully",
      order: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Error uploading shipping bill:", error);
    res.status(500).json({ error: "Failed to upload shipping bill" });
  }
});

// DELETE route to remove shipping bill
router.delete(
  "/:orderId/shipping-bill",
  authenticateToken,
  adminMiddleware,
  async (req, res) => {
    const { orderId } = req.params;

    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Get the current shipping_bill_url
        const orderResult = await client.query(
          "SELECT shipping_bill_url FROM orders WHERE id = $1",
          [orderId]
        );

        if (orderResult.rows.length === 0) {
          await client.query("ROLLBACK");
          return res.status(404).json({ message: "Order not found." });
        }

        const currentShippingBillUrl = orderResult.rows[0].shipping_bill_url;

        if (currentShippingBillUrl) {
          // Extract public ID from Cloudinary URL
          const publicId = currentShippingBillUrl
            .split("/")
            .pop()
            .split(".")[0];
          await cloudinary.uploader.destroy(`shipping_bills/${publicId}`); // Assuming folder structure
        }

        // Update the database to remove the shipping bill URL
        await client.query(
          "UPDATE orders SET shipping_bill_url = NULL WHERE id = $1",
          [orderId]
        );

        await client.query("COMMIT");
        res
          .status(200)
          .json({ message: "Shipping bill removed successfully." });
      } catch (dbErr) {
        await client.query("ROLLBACK");
        console.error("Database error during shipping bill removal:", dbErr);
        res.status(500).json({ message: "Failed to remove shipping bill." });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Error removing shipping bill:", err);
      res.status(500).json({ message: "Failed to remove shipping bill." });
    }
  }
);

module.exports = router;
