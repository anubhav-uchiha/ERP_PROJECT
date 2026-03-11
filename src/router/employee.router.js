const express = require("express");
const {
  createEmployee,
  getEmployeeById,
  getAllEmployees,
} = require("../controller/employee.controller");

const router = express.Router();

router.post("/createEmployee", createEmployee);
router.get("/getEmployeeById/:id", getEmployeeById);
router.get("/getAllEmployees", getAllEmployees);

module.exports = router;
