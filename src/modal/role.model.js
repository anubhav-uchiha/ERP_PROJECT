const mongoose = require("mongoose");
// Import predefined permissions list from utils file
const PERMISSIONS = require("../utils/permissions.js");
const MODULES = require("../utils/modules.js");
// Create a schema for Role collection
const roleSchema = mongoose.Schema(
  {
    // Role name field
    name: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    // Description of the role
    description: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    // Description of the role
    permissions: {
      type: [
        {
          // Module name for which permission applies (Example: USER, COMPANY)
          module: {
            type: String,
            required: true,
            trim: true,
            uppercase: true, // Convert module name to uppercase
            enum: MODULES,
          },
          // Action allowed on that module (Example: CREATE, READ, UPDATE, DELETE)
          action: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            enum: PERMISSIONS, // Only allow actions that exist inside PERMISSIONS array
          },
        },
      ],
      required: true,
      default: [],
      // Custom validation function:
      // This checks that the permissions array is NOT empty.
      // If permissions.length is greater than 0, validation passes.
      validate: [
        {
          validator: function (value) {
            return value.length > 0;
          },
          // Error message returned if validation fails
          // (when permissions array is empty).
          message: "At least one permission required",
        },
      ],
    },
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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

roleSchema.index(
  { name: 1, companyId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

// roleSchema.pre("validate", function (next) {
//   this.permissions = this.permissions.map((p) => p.trim());
//   next();
// });

// This is a Mongoose middleware (hook) that runs BEFORE validation
// whenever a Role document is validated
roleSchema.pre("validate", function (next) {
  // If the permissions field does not exist OR
  // the permissions array is empty, skip duplicate checking
  // and move to the next middleware/validation step
  if (!this.permissions || this.permissions.length === 0) {
    return next();
  }

  // Create a new array by mapping each permission object.
  // Combine module and action into a unique string like:
  // "USER_CREATE", "PRODUCT_DELETE", etc.
  // This helps detect duplicate permission combinations.

  const permissionKeys = this.permissions.map((p) => `${p.module}_${p.action}`);

  // Convert the permissionKeys array into a Set.
  // A Set automatically removes duplicate values.
  const uniqueKeys = new Set(permissionKeys);

  // If the size of the Set is smaller than the original array,
  // it means duplicates existed in the permission combinations.
  if (uniqueKeys.size !== permissionKeys.length) {
    // Stop validation and return an error if duplicate
    // module-action combinations are found.
    return next(
      new Error("Duplicate module-action permission combination detected"),
    );
  }

  next();
});

roleSchema.index({ name: 1, isActive: 1 });

roleSchema.query.active = function () {
  return this.where({ isActive: true, isDeleted: false });
};

// Create a Mongoose model named "Role" using the roleSchema.
// This model represents the "roles" collection in MongoDB.
const Role = mongoose.model("Role", roleSchema);
// Export the Role model so it can be used in other files
module.exports = Role;
