const Role = require("../modal/role.model.js");
const Modules = require("../utils/modules.js");
const Actions = require("../utils/permissions.js");

async function sysOwnerPermissions() {
  try {
    const owners = await Role.find({ name: "OWNER" });
    for (const role of owners) {
      const missingPermissions = [];
      Modules.forEach((module) => {
        Actions.forEach((action) => {
          const exists = role.permissions.some(
            (p) => p.module === module && p.action === action,
          );
          if (!exists) {
            missingPermissions.push({ module, action });
          }
        });
      });
      if (missingPermissions.length > 0) {
        role.permissions.push(...missingPermissions);
        await role.save();
      }
    }

    console.log("Owner permissions synced successfully");
  } catch (error) {
    console.log(error);
  }
}
sysOwnerPermissions();
