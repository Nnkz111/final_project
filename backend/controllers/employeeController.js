const db = require("../config/db");

// Get all employees
exports.getEmployees = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT e.*, u.username
      FROM employees e
      JOIN users u ON e.user_id = u.id
      ORDER BY e.id DESC
    `);
    // Add employee_code field formatted as 3 digits
    const employees = rows.map((emp) => ({
      ...emp,
      employee_code: emp.id.toString().padStart(3, "0"),
    }));
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add employee
const bcrypt = require("bcrypt");
const saltRounds = 10;

exports.addEmployee = async (req, res) => {
  const { username, password, name, email, phone, role } = req.body;
  try {
    // Hash the password before storing
    const passwordHash = await bcrypt.hash(password, saltRounds);
    // 1. Create user in users table with role
    const userResult = await db.query(
      `INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role`,
      [username, email, passwordHash, role || "employee"]
    );
    if (!userResult.rows.length) {
      return res.status(400).json({
        error: "Failed to create user. Username or email may already exist.",
      });
    }
    const user_id = userResult.rows[0].id;
    // 2. Create employee in employees table
    const { rows } = await db.query(
      `INSERT INTO employees (user_id, name, email, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, name, email, phone, role || "ພະນັກງານ"]
    );
    // Add employee_code field formatted as 3 digits
    const employee = {
      ...rows[0],
      employee_code: rows[0].id.toString().padStart(3, "0"),
      username: userResult.rows[0].username,
      user_email: userResult.rows[0].email,
      user_role: userResult.rows[0].role,
    };
    res.status(201).json(employee);
  } catch (err) {
    // Check for unique violation
    if (err.code === "23505") {
      res.status(400).json({ error: "Username or email already exists." });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};

// Edit employee
exports.editEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, status } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE employees SET name=$1, email=$2, phone=$3, role=$4, status=$5 WHERE id=$6 RETURNING *`,
      [name, email, phone, role, status, id]
    );
    // Add employee_code field formatted as 3 digits
    const employee = {
      ...rows[0],
      employee_code: rows[0].id.toString().padStart(3, "0"),
    };
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete employee and corresponding user
exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    // Get user_id from employees table
    const empResult = await db.query(
      "SELECT user_id FROM employees WHERE id=$1",
      [id]
    );
    if (!empResult.rows.length) {
      return res.status(404).json({ error: "Employee not found" });
    }
    const user_id = empResult.rows[0].user_id;
    // Delete employee
    await db.query("DELETE FROM employees WHERE id=$1", [id]);
    // Delete user
    await db.query("DELETE FROM users WHERE id=$1", [user_id]);
    res.json({ message: "Employee and user deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
