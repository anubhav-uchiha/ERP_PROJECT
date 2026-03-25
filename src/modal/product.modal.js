const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 100,
      index: true,
    },
    product_code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 20,
    },
    product_category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 100,
      index: true,
    },
    product_price: {
      type: Number,
      required: true,
      min: 0,
    },
    product_cost_price: {
      type: Number,
      required: true,
      min: 0,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      index: true,
    },
    stock_quantity: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    product_description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    minStockLevel: {
      type: Number,
      default: 10,
    },
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    isStock: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
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

productSchema.index({ companyId: 1, product_name: 1, product_code: 1 });

productSchema.index(
  { companyId: 1, product_code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

productSchema.index(
  { companyId: 1, product_name: 1 },
  { partialFilterExpression: { isDeleted: false } },
);

productSchema.query.active = function () {
  return this.where({ isDeleted: false, isActive: true });
};

productSchema.pre("validate", function (next) {
  if (this.product_name) {
    this.product_name = this.product_name?.trim()?.toLowerCase();
  }
  if (this.product_code) {
    this.product_code = this.product_code?.trim()?.toUpperCase();
  }
  next();
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
