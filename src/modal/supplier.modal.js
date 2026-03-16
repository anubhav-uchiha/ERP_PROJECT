const mongoose = require("mongoose");

const addressSchema = mongoose.Schema(
  {
    address_line_1: {
      type: String,
      required: true,
      trim: true,
    },

    address_line_2: {
      type: String,
      trim: true,
      default: "",
    },
    address_line_3: {
      type: String,
      trim: true,
      default: "",
    },
    address_line_4: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    zipcode: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{4,10}$/, "Invalid Zipcode"],
    },
  },
  { _id: false },
);

const supplierSchema = new mongoose.Schema(
  {
    supplier_name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    supplier_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    supplier_phone: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 15,
    },
    supplier_address: {
      type: addressSchema,
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
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

supplierSchema.index(
  { companyId: 1, supplier_email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

supplierSchema.index(
  { companyId: 1, supplier_phone: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

supplierSchema.query.active = function () {
  return this.where({ isDeleted: false, isActive: true });
};

supplierSchema.pre("validate", function (next) {
  if (this.supplier_email) {
    this.supplier_email = this.supplier_email.trim().toLowerCase();
  }
  next();
});

const Supplier = mongoose.model("Supplier", supplierSchema);
module.exports = Supplier;
