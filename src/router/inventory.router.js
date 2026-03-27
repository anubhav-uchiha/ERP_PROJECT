const express = require("express");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const {
  addStock,
  removeStock,
  adjustStock,
  getInventoryHistory,
  getLowStockProducts,
} = require("../controller/inventory.controller");

const router = express.Router();
router.post(
  "/addStock",
  authenticate,
  authorize("INVENTORY", "CREATE"),
  addStock,
);
router.post(
  "/removeStock",
  authenticate,
  authorize("INVENTORY", "CREATE"),
  removeStock,
);
router.PUT(
  "/adjustStock",
  authenticate,
  authorize("INVENTORY", "UPDATE"),
  adjustStock,
);
router.get(
  "/getInventoryHistory",
  authenticate,
  authorize("INVENTORY", "READ"),
  getInventoryHistory,
);
router.get(
  "/getLowStockProducts",
  authenticate,
  authorize("INVENTORY", "READ"),
  getLowStockProducts,
);
module.exports = router;
