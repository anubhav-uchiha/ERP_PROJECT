const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
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
});

const companySchema = mongoose.Schema(
  {
    company_name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    company_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    company_phone: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 15,
    },
    company_address: {
      type: addressSchema,
      required: true,
    },
    company_industry: {
      type: String,
      required: false,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slug: {
      type: String,
      trim: true,
      required: false,
      lowercase: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

companySchema.index(
  { ownerId: 1, company_email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

companySchema.query.active = function () {
  return this.where({ isDeleted: false, isActive: true });
};

companySchema.pre("save", function (next) {
  if (this.isModified("company_name") && this.company_name) {
    this.slug = this.company_name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "");
  }
  next();
});

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
