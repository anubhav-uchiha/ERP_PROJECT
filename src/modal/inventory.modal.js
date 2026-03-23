const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyId",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT"],
      uppercase: true,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    referenceType: {
      type: String,
      enum: ["PURCHASE", "SALE", "MANUAL"],
      required: true,
      uppercase: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stockAfterTransation: {
      type: Number,
      required: true,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = Inventory;
