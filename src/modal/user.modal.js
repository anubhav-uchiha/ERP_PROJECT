// Import the mongoose library to interact with mongoDB
const mongoose = require("mongoose");

// create a schema that definesthe structure of the User document in MongoDB
const userSchema = mongoose.Schema(
  {
    // User's first name field
    first_name: {
      type: String, // Data type of the field
      required: true, // This field is mandatory
      trim: true, // Removes whitespace from beginning and end
      minlength: 2, // Minimum allowed charactoers
      maxlength: 50, // Maximum allowed charactoers
    },
    //  User's last name field
    last_name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    //  User's email address
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true, // convert email to lowercase automatically
      match: [/^\S+@\S+\.\S+$/, "Invalid email"], // Regex validation for email format
    },
    // User password field
    password: {
      type: String, // Password stored as string (usually hashed before saving)
      required: true,
      select: false, // Prevents password from being returned in queries by default
      minlength: 6,
    },
    // Role reference
    roleId: {
      // typically this will reference anthor collection like "roles"
      type: mongoose.Schema.Types.ObjectId, // Stores mongoDB ObjectId
      ref: "Role", // Creates relationship with Role collection
      default: null, // Stores the null values if no id is provided
    },
    // company reference
    companyId: {
      type: mongoose.Schema.Types.ObjectId, // store the objectId of the company document
      ref: "Company", // this creates a referense to the "Company model"
      default: null, // if the user does not belog to any company
    },
    // indicates whether the user account is active
    isActive: {
      type: Boolean, // boolean value store "true" or "false"
      default: true, // by default, every newly created user will be active
    },
    // indicates whether the user has verified their account
    isVerified: {
      type: Boolean, // true if email/phone verification is done
      default: false, //when user first registers, they are not verified.
    },
    // soft delete flag for the user account
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    /** Automatically adds two fields to the schema:
     *  createdAt → when the document was created
     *  updatedAt → when the document was last updated
     */
    timestamps: true,
    /** When converting a document to JSON (for example when sending API response),
     *  include virtual fields (like fullName).
     */
    toJSON: { virtuals: true },
    /** When converting a document to plain JavaScript object,
     *  include virtual fields.
     */
    toObject: { virtuals: true },
  },
);
// create a compound index on companyId and email
// 1 means ascending index for both fields
userSchema.index(
  { companyId: 1, email: 1 },
  /** unique: true → prevents duplicate email within the same company
   * partialFilterExpression → this rule applies only if isDeleted = false
   * this allows duplicate emails if the old record is soft-deleted
   */
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
// Create index for roleId and isDeleted
userSchema.index({ roleId: 1, isDeleted: 1 });
// Create index for companyId and isDeleted
userSchema.index({ companyId: 1, isDeleted: 1 });
// Add a custom query helper called "active"
userSchema.query.active = function () {
  /** When you use .active() in a query, it automatically filters:
   * isDeleted = false (not soft deleted)
   * isActive = true (active users only)
   */
  return this.where({ isDeleted: false, isActive: true });
};

// Create a virtual field called "fullName"
userSchema.virtual("fullName").get(function () {
  /** Combines first_name and last_name into a single fullName field
   * || "" prevents undefined values
   * trim() removes extra spaces
   */
  return `${this.first_name || ""} ${this.last_name || ""}`.trim();
});

// Customize how the document is converted when sending it as JSON
userSchema.set("toJSON", {
  // transform function allows modifying the object before returning it
  // doc → original mongoose document
  // ret → plain JavaScript object that will be returned
  transform: function (doc, ret) {
    // Remove the password field from the response
    // This is important for security so the hashed password is never exposed in API responses
    delete ret.password;
    // Return the modified object after removing sensitive fields
    return ret;
  },
});

// Mongoose middleware that runs BEFORE validation happens
userSchema.pre("validate", function (next) {
  // Check if email field exists
  if (this.email) {
    // trim() → removes spaces before and after the email
    // toLowerCase() → converts email to lowercase
    // This ensures emails are stored consistently (e.g., TEST@MAIL.COM → test@mail.com)
    this.email = this.email.trim().toLowerCase();
  }
  // Pass control to the next middleware or continue validation
  next();
});
// Create a Mongoose model named "User"
// This tells Mongoose:
// Use userSchema
// Store data in the "users" collection in MongoDB

const User = mongoose.model("User", userSchema);

// Export the User model so it can be used in other files
module.exports = User;
