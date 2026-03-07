const Role = require("../modal/role.model.js");

const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      const role = await Role.findById(req.user.roleId);
      if (!role) {
        return res.status(403).json({
          success: false,
          message: "Role not found",
        });
      }

      const allowed = role.permissions.some(
        (p) => p.module === module && p.action === action,
      );
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "Permission denied",
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal error",
      });
    }
  };
};

module.exports = checkPermission;
