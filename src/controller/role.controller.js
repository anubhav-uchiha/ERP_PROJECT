const Role = require("../modal/role.model.js");
const PERMISSIONS = require("../utils/permissions.js");
const MODULES = require("../utils/modules.js");

const createRole = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const { name, description, permissions } = req.body;

    if (!name?.trim() || !permissions) {
      return res.status(400).json({
        success: false,
        message: "Role name and permissions are required",
      });
    }

    if (!Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Permissions must be a non-empty array",
      });
    }

    const roleName = name.trim().toUpperCase();

    const roleExist = await Role.findOne({
      name: roleName,
      companyId,
      isDeleted: false,
    });

    if (roleExist) {
      return res.status(409).json({
        success: false,
        message: "Role already exists in the company",
      });
    }

    for (const p of permissions) {
      if (
        typeof p !== "object" ||
        typeof p.module !== "string" ||
        typeof p.action !== "string" ||
        !p.module?.trim() ||
        !p.action?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid permission format",
        });
      }
      const moduleName = p.module.trim().toUpperCase();
      const actionName = p.action.trim().toUpperCase();
      if (!MODULES.includes(moduleName)) {
        return res.status(400).json({
          success: false,
          message: `Invalid module: ${moduleName}`,
        });
      }
      if (!PERMISSIONS.includes(actionName)) {
        return res.status(400).json({
          success: false,
          message: `Invalid action: ${actionName}`,
        });
      }
    }

    const formattedPermissions = permissions.map((p) => ({
      module: p.module.trim().toUpperCase(),
      action: p.action.trim().toUpperCase(),
    }));

    const uniquePermissions = [
      ...new Map(
        formattedPermissions.map((p) => [`${p.module}_${p.action}`, p]),
      ).values(),
    ];

    const role = await Role.create({
      name: roleName,
      description: description?.trim() || "",
      companyId,
      permissions: uniquePermissions,
    });
    return res.status(201).json({
      success: true,
      message: "Role created successfully!",
      data: role,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Role already exists" });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  createRole,
};
