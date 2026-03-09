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

const router = express.Router();

router.post("/createRole", createRole);
router.get("/getRoleById/:id", getRoleById);
router.get("/getAllRole", getAllRole);
router.put("/updateRole/:id", updateRole);
router.patch("/toggleRoleStatus/:id", toggleRoleStatus);
router.delete("/softDeleteRole/:id", softDeleteRole);
router.delete("/deleteRole/:id", deleteRole);

module.exports = router;
