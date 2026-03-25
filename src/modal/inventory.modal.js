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
      ref: "Company",
      required: true,
      index: true,
    },
    transactionCode: {
      type: String,
      required: true,
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
    unitPrice: {
      type: Number,
      default: 0,
    },
    totalValue: {
      type: Number,
      default: 0,
    },
    referenceType: {
      type: String,
      enum: ["PURCHASE", "SALE", "MANUAL", "ADJUSTMENT"],
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
    stockAfterTransaction: {
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
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

inventorySchema.index({ companyId: 1, productId: 1, createdAt: -1 });

inventorySchema.index({ transactionCode: 1 }, { unique: true });

inventorySchema.query.active = function () {
  return this.where({ isDeleted: false, isActive: true });
};

const Inventory = mongoose.model("Inventory", inventorySchema);

module.exports = Inventory;
