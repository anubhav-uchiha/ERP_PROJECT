const express = require("express");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const {
  createSupplier,
  getSupplierById,
  supplierUpdate,
  toggleSupplierStatus,
  softDeleteSupplier,
  deleteSupplierById,
} = require("../controller/supplier.controller");

const router = express.Router();

router.post(
  "/createSupplier",
  authenticate,
  authorize("SUPPLIER", "CREATE"),
  createSupplier,
);
router.get(
  "/getSupplierById/:id",
  authenticate,
  authorize("SUPPLIER", "READ"),
  getSupplierById,
);
router.get(
  "/getAllSupplier",
  authenticate,
  authorize("SUPPLIER", "READ"),
  getSupplierById,
);
router.put(
  "/supplierUpdate/:id",
  authenticate,
  authorize("SUPPLIER", "UPDATE"),
  supplierUpdate,
);
router.patch(
  "/toggleSupplierStatus/:id",
  authenticate,
  authorize("SUPPLIER", "UPDATE"),
  toggleSupplierStatus,
);
router.delete(
  "/softDeleteSupplier/:id",
  authenticate,
  authorize("SUPPLIER", "DELETE"),
  softDeleteSupplier,
);
router.delete(
  "/deleteSupplierById/:id",
  authenticate,
  authorize("SUPPLIER", "DELETE"),
  deleteSupplierById,
);
router.delete(
  "/deleteAllSupplier",
  authenticate,
  authorize("SUPPLIER", "DELETE"),
  deleteSupplierById,
);

module.exports = router;
