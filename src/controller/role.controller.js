const Role = require("../modal/role.model.js");
const PERMISSIONS = require("../utils/permissions.js");
const MODULES = require("../utils/modules.js");
const { default: mongoose } = require("mongoose");

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

const getRoleById = async (req, res) => {
  try {
    const roleId = req.params.id;

    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role id" });
    }

    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "Unauthorized Access" });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid compnay id" });
    }

    const role = await Role.findOne({
      _id: roleId,
      companyId: companyId,
      isDeleted: false,
    });

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "No ROle Found!" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Role Fetch Successfully", data: role });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getAllRole = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized Access" });
    }
    const { page_no = 1, page_size = 10, search } = req.query;
    const pageNo = Math.max(parseInt(page_no) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(page_size) || 10, 1), 100);
    const skip = (pageNo - 1) * pageSize;

    const filter = {
      companyId: companyId,
      isDeleted: false,
      isActive: true,
    };

    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const [roles, totalRoles] = await Promise.all([
      Role.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Role.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Role fetched Successfully",
      current_page: pageNo,
      page_size: pageSize,
      total_records: totalRoles,
      total_pages: Math.ceil(totalRoles / pageSize),
      data: roles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const roleId = req.params.id;
    const companyId = req.user.companyId;
    const { name, description, permissions } = req.body;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unathorized Access",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role Id" });
    }
    const role = await Role.findOne({
      _id: roleId,
      companyId,
      isDeleted: false,
    });

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role Not Found" });
    }

    if (role.isSystemRole) {
      return res.status(403).json({
        success: false,
        message: "System roles cannot be modified",
      });
    }

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Role name cannot be empty",
      });
    }

    if (name?.trim()) {
      const roleName = name.trim().toUpperCase();

      if (role.name !== roleName) {
        const existingRole = await Role.findOne({
          name: roleName,
          companyId,
          _id: { $ne: roleId },
          isDeleted: false,
        });

        if (existingRole) {
          return res
            .status(409)
            .json({ success: false, message: "Role name already exixts" });
        }
        role.name = roleName;
      }
    }
    if (description !== undefined) {
      role.description = description ? description.trim() : "";
    }
    if (permissions !== undefined) {
      if (!Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Permissions must be a non-empty array",
        });
      }
      for (const p of permissions) {
        if (
          typeof p !== "object" ||
          typeof p.module !== "string" ||
          typeof p.action !== "string" ||
          !p.module.trim() ||
          !p.action.trim()
        ) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid permission format" });
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
      role.permissions = uniquePermissions;
    }
    await role.save();
    return res.status(200).json({
      success: true,
      message: "Role Updated Successfully",
      data: role,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const toggleRoleStatus = async (req, res) => {
  try {
    const roleId = req.params.id;
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized Access",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role Id" });
    }

    const role = await Role.findOne({
      _id: roleId,
      companyId,
      isDeleted: false,
    });

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role Not Found" });
    }

    if (role.isSystemRole) {
      return res.status(403).json({
        success: false,
        message: "System roles cannot be modified",
      });
    }
    role.isActive = !role.isActive;
    await role.save();
    return res.status(200).json({
      success: true,
      message: `Role ${role.isActive ? "activated" : "deactivated"} successfully`,
      data: role,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const softDeleteRole = async (req, res) => {
  try {
    const roleId = req.params.id;
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized Access",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role Id" });
    }

    const role = await Role.findOne({
      _id: roleId,
      companyId,
      isDeleted: false,
    });

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role Not Found" });
    }

    if (role.isSystemRole) {
      return res.status(403).json({
        success: false,
        message: "System roles cannot be modified",
      });
    }

    role.isDeleted = true;
    role.isActive = false;

    await role.save();

    return res.status(200).json({
      success: true,
      message: "Role deleted Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const roleId = req.params.id;
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized Access",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role Id" });
    }

    const role = await Role.findOne({
      _id: roleId,
      companyId,
    });

    if (!role) {
      return res
        .status(404)
        .json({ success: false, message: "Role Not Found" });
    }

    if (role.isSystemRole) {
      return res.status(403).json({
        success: false,
        message: "System roles cannot be modified",
      });
    }
    await Role.deleteOne({ _id: roleId });
    return res.status(200).json({
      success: true,
      message: "Role permanently deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  createRole,
  getRoleById,
  getAllRole,
  updateRole,
  toggleRoleStatus,
  softDeleteRole,
  deleteRole,
};
