const express = require("express");
const { createCompany } = require("../controller/company.controller");

const router = express.Router();

router.post("/createCompany", createCompany);

module.exports = router;
