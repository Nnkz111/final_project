const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // Import the database pool
const authenticateToken = require("../middleware/authMiddleware"); // Import authentication middleware

// Get cart items for a user
router.get("/:userId", authenticateToken, async (req, res) => {
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
router.get("/count/:userId", authenticateToken, async (req, res) => {
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
router.post("/add", authenticateToken, async (req, res) => {
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
router.delete("/remove/:cartItemId", authenticateToken, async (req, res) => {
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
});

// Update the quantity of a cart item
router.put("/update/:cartItemId", authenticateToken, async (req, res) => {
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
router.delete("/clear", authenticateToken, async (req, res) => {
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

module.exports = router;
