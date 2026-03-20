const express = require("express");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  toggleProductStatus,
  softDeleteProduct,
} = require("../controller/product.controller");

const router = express.Router();

router.post(
  "/createProduct",
  authenticate,
  authorize("PRODUCT", "CREATE"),
  createProduct,
);
router.get(
  "/getAllProducts",
  authenticate,
  authorize("PRODUCT", "READ"),
  getAllProducts,
);
router.get(
  "/getProductById/:id",
  authenticate,
  authorize("PRODUCT", "READ"),
  getProductById,
);
router.put(
  "/updateProduct/:id",
  authenticate,
  authorize("PRODUCT", "UPDATE"),
  updateProduct,
);
router.patch(
  "/toggleProductStatus/:id",
  authenticate,
  authorize("PRODUCT", "UPDATE"),
  toggleProductStatus,
);
router.delete(
  "/softDeleteProduct/:id",
  authenticate,
  authorize("PRODUCT", "DELETE"),
  softDeleteProduct,
);
