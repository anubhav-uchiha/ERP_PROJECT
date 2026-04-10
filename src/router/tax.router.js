const express = require("express");
const authorize = require("../middlewares/authorize");
const authenticate = require("../middlewares/authenticate");
const {
  createTax,
  getTaxes,
  updateTaxStatus,
  getTaxById,
  softDeleteTax,
} = require("../controller/tax.controller");

const router = express.Router();

router.post("/createTax", authenticate, authorize("TAX", "CREATE"), createTax);
router.get("/getTax", authenticate, authorize("TAX", "READ"), getTaxes);
router.get(
  "/getTaxById/:id",
  authenticate,
  authorize("TAX", "READ"),
  getTaxById,
);
router.patch(
  "/updateTaxStatus",
  authenticate,
  authorize("TAX", "READ"),
  updateTaxStatus,
);
router.delete(
  "/softDeleteTax/:id",
  authenticate,
  authorize("TAX", "DELETE"),
  softDeleteTax,
);

module.exports = router;
