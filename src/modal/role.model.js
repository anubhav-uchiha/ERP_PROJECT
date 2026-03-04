const mongoose = require("mongoose");
const PERMISSIONS = require("../utils/permissions.js");

const roleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    permissions: {
      type: [
        {
          module: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
          },
          action: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            enum: PERMISSIONS,
          },
        },
      ],
      required: true,
      default: [],
      validate: [
        {
          validator: function (value) {
            return value.length > 0;
          },
          message: "At least one permission required",
        },
      ],
    },

    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },

    // permissions_2: {
    //   type: [String],
    //   required: true,
    //   default: [],
    //   enum: PERMISSIONS,
    //   validate: [
    //     (array) => array.length > 0,
    //     "At least one permission required",
    //   ],
    // },
  },
  { timestamps: true },
);

// roleSchema.pre("validate", function (next) {
//   this.permissions = this.permissions.map((p) => p.trim());
//   next();
// });
roleSchema.pre("validate", function (next) {
  if (!this.permissions || this.permissions.length === 0) {
    return next();
  }

  const permissionKeys = this.permissions.map((p) => `${p.module}_${p.action}`);

  const uniqueKeys = new Set(permissionKeys);

  if (uniqueKeys.size !== permissionKeys.length) {
    return next(
      new Error("Duplicate module-action permission combination detected"),
    );
  }

  next();
});

roleSchema.index({ name: 1, isActive: 1 });

roleSchema.query.active = function () {
  return this.where({ isActive: true });
};

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
