const express = require("express");
const {
  createEmployee,
  getEmployeeById,
} = require("../controller/employee.controller");

const router = express.Router();

router.post("/createEmployee", createEmployee);
router.get("/getEmployeeById/:id", getEmployeeById);

module.exports = router;
