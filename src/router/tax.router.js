const express = require("express");
const authorize = require("../middlewares/authorize");
const authenticate = require("../middlewares/authenticate");
const {
  createTax,
  getTaxes,
  updateTaxStatus,
} = require("../controller/tax.controller");

const router = express.Router();

router.post("/createTax", authenticate, authorize("TAX", "CREATE"), createTax);
router.get("/getTax", authenticate, authorize("TAX", "READ"), getTaxes);
router.patch(
  "/updateTaxStatus",
  authenticate,
  authorize("TAX", "READ"),
  updateTaxStatus,
);

module.exports = router;
