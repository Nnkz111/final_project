const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // Import the database pool
const authenticateToken = require("../middleware/authMiddleware"); // Import authentication middleware
const { body, param, validationResult } = require("express-validator"); // Import body, param, and validationResult

// Endpoint to get all categories
router.get("/", async (req, res) => {
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
router.post(
  "/",
  authenticateToken,
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Category name is required")
      .isLength({ max: 255 })
      .withMessage("Category name cannot exceed 255 characters"),
    body("parent_id")
      .optional({
        checkFalsy: true,
      })
      .isInt({ gt: 0 })
      .withMessage("Parent ID must be a positive integer"),
    body("image_url")
      .optional({
        checkFalsy: true,
      })
      .isURL()
      .withMessage("Image URL must be a valid URL")
      .isLength({ max: 255 })
      .withMessage("Image URL cannot exceed 255 characters"),
  ],
  async (req, res) => {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
      return res.status(403).json({ error: "Admin or staff access required" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, parent_id, image_url } = req.body;

    // if (!name) {
    //   return res.status(400).json({ error: "Category name is required" });
    // }

    try {
      const result = await pool.query(
        "INSERT INTO categories (name, parent_id, image_url) VALUES ($1, $2, $3) RETURNING id, name, parent_id, image_url",
        [name, parent_id || null, image_url || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Error creating category:", err);
      res.status(500).json({ error: "Failed to create category" });
    }
  }
);

// Endpoint to update a category by ID (Admin only)
router.put(
  "/:id",
  authenticateToken,
  [
    param("id").isInt().withMessage("Category ID must be an integer"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Category name cannot be empty")
      .isLength({ max: 255 })
      .withMessage("Category name cannot exceed 255 characters"),
    body("parent_id")
      .optional({
        checkFalsy: true,
      })
      .isInt({ gt: 0 })
      .withMessage("Parent ID must be a positive integer"),
    body("image_url")
      .optional({
        checkFalsy: true,
      })
      .isURL()
      .withMessage("Image URL must be a valid URL")
      .isLength({ max: 255 })
      .withMessage("Image URL cannot exceed 255 characters"),
  ],
  async (req, res) => {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "staff")) {
      return res.status(403).json({ error: "Admin or staff access required" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, parent_id, image_url } = req.body;

    // if (!name) {
    //   return res.status(400).json({ error: "Category name is required" });
    // }

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
      console.error("Error updating category:", err);
      res.status(500).json({ error: "Failed to update category" });
    }
  }
);

// Endpoint to delete a category by ID (Admin only)
router.delete("/:id", authenticateToken, async (req, res) => {
  // Only admin can delete categories
  if (!req.user || req.user.role !== "admin") {
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

module.exports = router;
