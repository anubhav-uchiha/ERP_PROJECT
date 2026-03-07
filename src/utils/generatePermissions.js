const Modules = require("./modules.js");
const Actions = require("./permissions.js");

const generateAllPermissions = () => {
  return Modules.flatMap((module) =>
    Actions.map((action) => ({
      module,
      action,
    })),
  );
};

module.exports = generateAllPermissions;
