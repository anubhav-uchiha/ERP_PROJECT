const express = require("express");
const { createCompany } = require("../controller/company.controller");
const authenticate = require("../middlewares/authenticate");

const router = express.Router();

router.post("/createCompany", authenticate, createCompany);

module.exports = router;
