const mongoose = require("mongoose");

// Create a schema for storing address information
const addressSchema = mongoose.Schema({
  // First line of the address (usually house number + street)
  address_line_1: {
    type: String,
    required: true,
    trim: true,
  },

  // Second line of the address (optional, like apartment or suite)
  address_line_2: {
    type: String,
    trim: true,
    default: "",
  },
  // Third line of address (optional)
  address_line_3: {
    type: String,
    trim: true,
    default: "",
  },
  // Fourth line of address (optional)
  address_line_4: {
    type: String,
    trim: true,
    default: "",
  },
  // City name where the address is located
  city: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  // State or province of the address
  state: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  // Country name where the address belongs
  country: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  // Postal / Zip code of the address
  zipcode: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{4,10}$/, "Invalid Zipcode"],
    // Regex validation:
    // ^\d{4,10}$ means only digits allowed and length must be between 4 and 10
    // If validation fails, "Invalid Zipcode" error message will appear
  },
});

// Create schema for storing company information
const companySchema = mongoose.Schema(
  {
    // Name of the company
    company_name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    // Official company email address
    company_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    // Company's contact phone number
    company_phone: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 15,
    },
    // Embedded address object using addressSchema
    company_address: {
      type: addressSchema, // Uses the previously defined address schema
      required: true,
    },
    // Industry or business category of the company
    company_industry: {
      type: String,
      required: false,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // Reference to the User who owns this company
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // URL friendly identifier for the company
    slug: {
      type: String,
      trim: true,
      required: false,
      lowercase: true,
      index: true,
    },
    // Determines whether the company is active in the system
    isActive: {
      type: Boolean,
      default: true,
    },
    // soft delete flag for the user account
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

companySchema.index(
  { ownerId: 1, company_email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);

companySchema.query.active = function () {
  return this.where({ isDeleted: false, isActive: true });
};
// Middleware that runs before saving a document to the database
companySchema.pre("save", function (next) {
  // Check if the company_name field was modified and it has a value
  if (this.isModified("company_name") && this.company_name) {
    // Generate a URL-friendly slug from the company name
    this.slug = this.company_name
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace one or more spaces with a hyphen (-)
      .replace(/[^\w\-]+/g, ""); // Remove any characters that are not letters, numbers, or hyphens
  }
  next();
});
// Create a Mongoose model named "Company" using the companySchema
// This allows you to interact with the "companies" collection in MongoDB
const Company = mongoose.model("Company", companySchema);
// Export the Company model so it can be used in other files
module.exports = Company;
