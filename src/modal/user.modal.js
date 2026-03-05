const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.index(
  { companyId: 1, email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

userSchema.index({ roleId: 1, isDeleted: 1 });
userSchema.index({ companyId: 1, isDeleted: 1 });

userSchema.query.active = function () {
  return this.where({ isDeleted: false, isActive: true });
};

userSchema.virtual("fullName").get(function () {
  return `${this.first_name || ""} ${this.last_name || ""}`.trim();
});

userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

userSchema.pre("validate", function (next) {
  if (this.email) {
    this.email = this.email.trim().toLowerCase();
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
