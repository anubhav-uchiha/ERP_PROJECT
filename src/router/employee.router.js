const express = require("express");
const {
  createEmployee,
  getEmployeeById,
  getAllEmployees,
  updateEmployee,
  softDeleteEmployee,
  deleteEmployee,
} = require("../controller/employee.controller");
const authorize = require("../middlewares/authorize");
const authenticate = require("../middlewares/authenticate");

const router = express.Router();

router.post(
  "/createEmployee",
  authenticate,
  authorize("USER", "CREATE"),
  createEmployee,
);
router.get(
  "/getEmployeeById/:id",
  authenticate,
  authorize("USER", "READ"),
  getEmployeeById,
);
router.get(
  "/getAllEmployees",
  authenticate,
  authorize("USER", "READ"),
  getAllEmployees,
);
router.put(
  "/updateEmployee/:id",
  authenticate,
  authorize("USER", "UPDATE"),
  updateEmployee,
);
router.delete(
  "/softDeleteEmployee/:id",
  authenticate,
  authorize("USER", "DELETE"),
  softDeleteEmployee,
);
router.delete(
  "/deleteEmployee/:id",
  authenticate,
  authorize("USER", "DELETE"),
  deleteEmployee,
);

module.exports = router;
