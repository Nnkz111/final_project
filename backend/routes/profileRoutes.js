const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authenticateToken = require("../middleware/authMiddleware");

// GET user profile
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const userProfileQuery = `
                    SELECT
                        u.id AS user_id,
                        u.username,
                        u.email,
                        u.is_admin,
                        u.created_at AS user_created_at,
                        c.id AS customer_id,
                        c.name AS customer_name,
                        c.phone,
                        c.address,
                        c.created_at AS customer_created_at,
                        c.updated_at AS customer_updated_at
                    FROM users u
                    LEFT JOIN customers c ON u.id = c.user_id
                    WHERE u.id = $1;
                `;
    const result = await pool.query(userProfileQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User profile not found" });
    }

    const userProfile = result.rows[0];

    const formattedUserProfile = {
      id: userProfile.user_id,
      username: userProfile.username,
      email: userProfile.email,
      is_admin: userProfile.is_admin,
      created_at: userProfile.user_created_at,
      customer: {
        id: userProfile.customer_id,
        name: userProfile.customer_name,
        phone: userProfile.phone,
        address: userProfile.address,
        created_at: userProfile.customer_created_at,
        updated_at: userProfile.customer_updated_at,
      },
    };

    res.json(formattedUserProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// PUT update user profile
router.put("/", authenticateToken, async (req, res) => {
  const { username, email, name, phone, address } = req.body;
  const userId = req.user.userId;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Update users table
    const userUpdateFields = [];
    const userUpdateParams = [];
    let userParamIndex = 1;

    if (email !== undefined) {
      userUpdateFields.push(`email = $${userParamIndex++}`);
      userUpdateParams.push(email);
    }
    // Username is typically not changeable via profile update, often handled separately
    // if (username !== undefined) { userUpdateFields.push(`username = $${userParamIndex++}`); userUpdateParams.push(username); }

    if (userUpdateFields.length > 0) {
      userUpdateParams.push(userId);
      await client.query(
        `UPDATE users SET ${userUpdateFields.join(
          ", "
        )} WHERE id = $${userParamIndex} RETURNING *`,
        userUpdateParams
      );
    }

    // Update or insert into customers table
    const customerResult = await client.query(
      "SELECT id FROM customers WHERE user_id = $1",
      [userId]
    );
    if (customerResult.rows.length > 0) {
      // Customer record exists, update it
      const customerUpdateFields = [];
      const customerUpdateParams = [];
      let customerParamIndex = 1;

      if (name !== undefined) {
        customerUpdateFields.push(`name = $${customerParamIndex++}`);
        customerUpdateParams.push(name);
      }
      if (phone !== undefined) {
        customerUpdateFields.push(`phone = $${customerParamIndex++}`);
        customerUpdateParams.push(phone);
      }
      if (address !== undefined) {
        customerUpdateFields.push(`address = $${customerParamIndex++}`);
        customerUpdateParams.push(address);
      }

      if (customerUpdateFields.length > 0) {
        customerUpdateParams.push(userId);
        await client.query(
          `UPDATE customers SET ${customerUpdateFields.join(
            ", "
          )}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${customerParamIndex}`,
          customerUpdateParams
        );
      }
    } else {
      // No customer record, insert a new one
      if (name || phone || address) {
        // Only insert if there's data to insert
        await client.query(
          "INSERT INTO customers (user_id, name, phone, address) VALUES ($1, $2, $3, $4)",
          [userId, name || null, phone || null, address || null]
        );
      }
    }

    await client.query("COMMIT");

    // Re-fetch the updated profile to send back the latest data
    const updatedProfileResult = await pool.query(
      `
            SELECT
                u.id AS user_id,
                u.username,
                u.email,
                u.is_admin,
                u.created_at AS user_created_at,
                c.id AS customer_id,
                c.name AS customer_name,
                c.phone,
                c.address,
                c.created_at AS customer_created_at,
                c.updated_at AS customer_updated_at
            FROM users u
            LEFT JOIN customers c ON u.id = c.user_id
            WHERE u.id = $1;
            `,
      [userId]
    );

    const updatedUserProfile = updatedProfileResult.rows[0];

    const formattedUpdatedUserProfile = {
      id: updatedUserProfile.user_id,
      username: updatedUserProfile.username,
      email: updatedUserProfile.email,
      is_admin: updatedUserProfile.is_admin,
      created_at: updatedUserProfile.user_created_at,
      customer: {
        id: updatedUserProfile.customer_id,
        name: updatedUserProfile.customer_name,
        phone: updatedUserProfile.phone,
        address: updatedUserProfile.address,
        created_at: updatedUserProfile.customer_created_at,
        updated_at: updatedUserProfile.customer_updated_at,
      },
    };

    res.json(formattedUpdatedUserProfile);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating user profile:", error.message);
    res.status(500).json({ message: "Server error", details: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
