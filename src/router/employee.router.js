const express = require("express");
const {
  createEmployee,
  getEmployeeById,
  getAllEmployees,
  updateEmployee,
  softDeleteEmployee,
  deleteEmployee,
} = require("../controller/employee.controller");

const router = express.Router();

router.post("/createEmployee", createEmployee);
router.get("/getEmployeeById/:id", getEmployeeById);
router.get("/getAllEmployees", getAllEmployees);
router.put("/updateEmployee/:id", updateEmployee);
router.delete("/softDeleteEmployee/:id", softDeleteEmployee);
router.delete("/deleteEmployee/:id", deleteEmployee);

module.exports = router;
