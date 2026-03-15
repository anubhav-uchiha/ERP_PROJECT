const express = require("express");
const {
  createRole,
  getRoleById,
  getAllRole,
  updateRole,
  toggleRoleStatus,
  softDeleteRole,
  deleteRole,
} = require("../controller/role.controller");
const authorize = require("../middlewares/authorize");
const authenticate = require("../middlewares/authenticate");

const router = express.Router();

router.post(
  "/createRole",
  authenticate,
  authorize("ROLE", "CREATE"),
  createRole,
);
router.get(
  "/getRoleById/:id",
  authenticate,
  authorize("ROLE", "READ"),
  getRoleById,
);
router.get("/getAllRole", authenticate, authorize("ROLE", "READ"), getAllRole);
router.put(
  "/updateRole/:id",
  authenticate,
  authorize("ROLE", "UPDATE"),
  updateRole,
);
router.patch(
  "/toggleRoleStatus/:id",
  authenticate,
  authorize("ROLE", "UPDATE"),
  toggleRoleStatus,
);
router.delete(
  "/softDeleteRole/:id",
  authenticate,
  authorize("ROLE", "DELETE"),
  softDeleteRole,
);
router.delete(
  "/deleteRole/:id",
  authenticate,
  authorize("ROLE", "DELETE"),
  deleteRole,
);

module.exports = router;
