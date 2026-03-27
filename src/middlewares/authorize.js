const express = require("express");
const authorize = (moduleName, action) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.roleId) {
        return res.status(403).json({
          success: false,
          message: "User role not found",
        });
      }
      const role = req.user.roleId;

      const allowed = role.permissions?.some(
        (perm) => perm.module === moduleName && perm.action === action,
      );

      if (!allowed) {
        return res
          .status(403)
          .json({ success: false, message: "Role permissions not found" });
      }
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Authorization error",
      });
    }
  };
};

module.exports = authorize;
