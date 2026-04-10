const mongoose = require("mongoose");

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["GST"],
      default: "GST",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: true,
    },
    isCustom: {
      type: Boolean,
      default: false,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
  },
  { timestamps: true },
);

taxSchema.index({ name: 1, companyId: 1 });

taxSchema.query.active = function () {
  return this.where({ isDeletewd: false, isActive: true });
};

const Tax = mongoose.model("Tax", taxSchema);
module.exports = Tax;
