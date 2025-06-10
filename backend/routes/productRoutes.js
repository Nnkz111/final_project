const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // Import the database pool
const cloudinary = require("../config/cloudinary"); // Import Cloudinary configuration
const authenticateToken = require("../middleware/authMiddleware"); // Import authentication middleware
// const authenticateToken = require('../middleware/authMiddleware'); // Will be created later

// Product routes
// Add a new endpoint to get new arrival products (public)
router.get("/new-arrivals", async (req, res) => {
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
router.get("/top-selling", async (req, res) => {
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
router.get("/", async (req, res) => {
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
      `(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex + 1})`
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
      `SELECT p.*, c.name AS category_name, p.name AS product_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where} ${orderByClause} LIMIT $${paramIndex} OFFSET $${
        paramIndex + 1
      }`,
      dataQueryParams
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM products p ${where}`,
      whereParams // Use only whereParams for the count query
    );

    res.json({
      products: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (err) {
    console.error("Error fetching products (backend):");
    console.error(err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// New endpoint to search for products
router.get("/search", async (req, res) => {
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
router.get("/:id", async (req, res) => {
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
router.post("/", authenticateToken, async (req, res) => {
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

// Update a product by ID (Admin only)
router.put("/:id", authenticateToken, async (req, res) => {
  // Ensure the user is an admin
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { id } = req.params;
  const { name, description, price, stock_quantity, category_id } = req.body;

  let imageUrl = null;

  // Check if a new image was uploaded
  if (req.files && req.files.productImage) {
    const file = req.files.productImage;

    try {
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: "product_images",
      });
      imageUrl = result.url;
    } catch (error) {
      console.error(
        "Error uploading product image to Cloudinary during update:",
        error
      );
      return res.status(500).json({ error: "Failed to upload new image" });
    }
  }

  try {
    let updateFields = [];
    let queryParams = [id];
    let paramIndex = 2; // Start from $2 for dynamic fields

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      queryParams.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      queryParams.push(description);
    }
    if (price !== undefined) {
      updateFields.push(`price = $${paramIndex++}`);
      queryParams.push(parseFloat(price));
    }
    if (stock_quantity !== undefined) {
      updateFields.push(`stock_quantity = $${paramIndex++}`);
      queryParams.push(parseInt(stock_quantity, 10));
    }
    if (category_id !== undefined) {
      updateFields.push(`category_id = $${paramIndex++}`);
      queryParams.push(category_id || null);
    }
    if (imageUrl !== null) {
      // Only update image_url if a new one was uploaded
      updateFields.push(`image_url = $${paramIndex++}`);
      queryParams.push(imageUrl);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const query = `UPDATE products SET ${updateFields.join(
      ", "
    )} WHERE id = $1 RETURNING *;`;
    const { rows } = await pool.query(query, queryParams);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(rows[0]); // Return the updated product
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a product by ID (Admin only)
router.delete("/:id", authenticateToken, async (req, res) => {
  // Ensure the user is an admin
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      "DELETE FROM products WHERE id = $1",
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
