const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

// Admin sales analytics route
router.get("/sales-analytics", async (req, res) => {
  const { group, start, end } = req.query;
  let query = "";
  let params = [];

  try {
    if (group === "day") {
      query = `
        SELECT
          TO_CHAR(o.created_at, 'YYYY-MM-DD') AS period,
          SUM(oi.quantity * oi.price) AS total
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'completed'
        ${
          start && end
            ? `AND o.created_at >= $1::date AND o.created_at <= $2::date`
            : ""
        }
        GROUP BY period
        ORDER BY period;
      `;
      if (start && end) params = [start, end];
    } else if (group === "week") {
      query = `
        SELECT
          TO_CHAR(DATE_TRUNC('week', o.created_at), 'YYYY-MM-DD') AS period,
          SUM(oi.quantity * oi.price) AS total
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'completed'
        ${
          start && end
            ? `AND o.created_at >= $1::date AND o.created_at <= $2::date`
            : ""
        }
        GROUP BY period
        ORDER BY period;
      `;
      if (start && end) params = [start, end];
    } else if (group === "month") {
      query = `
        SELECT
          TO_CHAR(DATE_TRUNC('month', o.created_at), 'YYYY-MM') AS period,
          SUM(oi.quantity * oi.price) AS total
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'completed'
        ${
          start && end
            ? `AND o.created_at >= $1::date AND o.created_at <= $2::date`
            : ""
        }
        GROUP BY period
        ORDER BY period;
      `;
      if (start && end) params = [start, end];
    } else if (group === "year") {
      query = `
        SELECT
          TO_CHAR(DATE_TRUNC('year', o.created_at), 'YYYY') AS period,
          SUM(oi.quantity * oi.price) AS total
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'completed'
        ${
          start && end
            ? `AND o.created_at >= $1::date AND o.created_at <= $2::date`
            : ""
        }
        GROUP BY period
        ORDER BY period;
      `;
      if (start && end) params = [start, end];
    } else {
      return res.status(400).json({ message: "Invalid group parameter." });
    }

    const { rows } = await pool.query(query, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching sales analytics:", error.message);
    console.error("Query:", query);
    console.error("Params:", params);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Admin top-selling products route
router.get("/top-selling-products", async (req, res) => {
  try {
    const query = `
      SELECT
        p.id,
        p.name,
        SUM(oi.quantity) AS total_quantity,
        SUM(oi.quantity * oi.price) AS total_sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.id, p.name
      ORDER BY total_sales DESC
      LIMIT 5;
    `;
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching top selling products:", error.message);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Admin stats route
router.get("/stats", async (req, res) => {
  try {
    const totalUsersQuery = "SELECT COUNT(*) FROM users;";
    const totalProductsQuery = "SELECT COUNT(*) FROM products;";
    const pendingOrdersQuery =
      "SELECT COUNT(*) FROM orders WHERE status = 'pending';";
    const totalOrdersQuery = "SELECT COUNT(*) FROM orders;";
    const totalSalesQuery =
      "SELECT SUM(CAST(total AS NUMERIC))::float FROM orders WHERE status = 'completed';";

    const totalUsers = (await pool.query(totalUsersQuery)).rows[0].count;
    const totalProducts = (await pool.query(totalProductsQuery)).rows[0].count;
    const pendingOrders = (await pool.query(pendingOrdersQuery)).rows[0].count;
    const totalOrders = (await pool.query(totalOrdersQuery)).rows[0].count;

    const totalSales = (await pool.query(totalSalesQuery)).rows[0].sum || 0;

    res.status(200).json({
      totalUsers,
      totalOrders,
      totalSales,
      totalCustomers: totalUsers,
      totalProducts,
      pendingOrders,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error.message);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Admin User Management route
router.get("/users", authenticateToken, async (req, res) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;
  const searchTerm = req.query.search; // Get the search term

  let whereClauses = [`u.is_admin = FALSE`];
  let queryParams = [limit, offset];
  let paramIndex = 3; // Start paramIndex from 3 for limit and offset

  if (searchTerm) {
    whereClauses.push(
      `(u.username ILIKE $${paramIndex++} OR u.email ILIKE $${paramIndex++})`
    );
    queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
  }

  const where = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  try {
    const usersQuery = `
      SELECT
        u.id,
        u.username,
        u.email,
        u.is_admin,
        u.created_at,
        u.status,
        c.name AS customer_name,
        c.phone,
        c.address,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS total_orders,
        (SELECT COALESCE(SUM(CAST(total AS NUMERIC)), 0) FROM orders WHERE user_id = u.id AND status = 'completed') AS total_spent
      FROM users u
      LEFT JOIN customers c ON u.id = c.user_id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const usersResult = await pool.query(usersQuery, queryParams);

    const countQuery = `SELECT COUNT(*) FROM users u ${where.replace(
      /u\./g,
      ""
    )};`;
    const countResult = await pool.query(countQuery, queryParams.slice(2));
    const totalUsers = parseInt(countResult.rows[0].count, 10);

    res.status(200).json({
      users: usersResult.rows,
      total: totalUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Admin User Management route - Update User (Admin only)
router.put("/users/:id", authenticateToken, async (req, res) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { id } = req.params;
  const { username, email, is_admin, status } = req.body;

  try {
    let updateFields = [];
    let queryParams = [id];
    let paramIndex = 2; // Start from $2 for dynamic fields

    if (username !== undefined) {
      updateFields.push(`username = $${paramIndex++}`);
      queryParams.push(username);
    }
    if (email !== undefined) {
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
      return res.status(400).json({ message: "No fields to update" });
    }

    const query = `UPDATE users SET ${updateFields.join(
      ", "
    )} WHERE id = $1 RETURNING *;`;
    const { rows } = await pool.query(query, queryParams);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User updated successfully", user: rows[0] });
  } catch (error) {
    console.error("Error updating user:", error.message);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Admin User Management route - Delete User (Admin only)
router.delete("/users/:id", authenticateToken, async (req, res) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { id } = req.params;

  try {
    // Prevent admin from deleting themselves (optional but recommended)
    if (req.user.userId == id) {
      return res
        .status(403)
        .json({ message: "Cannot delete your own admin account." });
    }

    // Delete related customer entry first if it exists
    await pool.query("DELETE FROM customers WHERE user_id = $1", [id]);

    // Then delete the user
    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [
      id,
    ]);

    if (rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error.message);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Admin Customer Management route
router.get("/customers", authenticateToken, async (req, res) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;

  try {
    const customersQuery = `
      SELECT c.id, c.user_id, c.name, c.email, c.phone, c.address, c.created_at, u.username, u.is_admin
      FROM customers c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const customersResult = await pool.query(customersQuery, [limit, offset]);

    const countQuery = `SELECT COUNT(*) FROM customers;`;
    const countResult = await pool.query(countQuery);
    const totalCustomers = parseInt(countResult.rows[0].count, 10);

    res.status(200).json({
      customers: customersResult.rows,
      total: totalCustomers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error.message);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

module.exports = router;
