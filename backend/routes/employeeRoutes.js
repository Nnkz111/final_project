const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");

// Get all employees
router.get("/", employeeController.getEmployees);
// Add new employee
router.post("/", employeeController.addEmployee);
// Edit employee
router.put("/:id", employeeController.editEmployee);
// Delete employee
router.delete("/:id", employeeController.deleteEmployee);

module.exports = router;
