// Import the Company mongoose model
const Company = require("../modal/company.model.js");
// Import validator library for validating email and other fields
const validator = require("validator");

// Controller function to create a new company
const createCompany = async (req, res) => {
  try {
    // Get the logged-in user's ID from the request (usually set by auth middleware)
    const ownerId = req.user._id;
    // Destructure company fields from the request body
    let {
      company_name,
      company_email,
      company_phone,
      company_address,
      company_industry,
    } = req.body;

    // Check if the user already owns a company
    // If companyId exists on the user object, prevent creating another company
    if (req.user.companyId) {
      return res
        .status(400)
        .json({ success: false, message: "User already owns a company" });
    }

    // Validate required fields
    // trim() removes extra spaces, ?. prevents errors if value is undefined
    if (
      !company_name?.trim() ||
      !company_email?.trim() ||
      !company_phone?.trim() ||
      !company_address
    ) {
      return res
        .status(400) // Return error if any required field is missing
        .json({ success: false, message: "All Field Are Required!" });
    }

    // Check if company_address is not an object
    // The address should be sent as an object containing multiple fields (city, state, etc.)
    if (typeof company_address !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "Company address is required" });
    }

    // Remove extra spaces from company name
    company_name = company_name.trim();
    // Remove spaces and convert email to lowercase (email normalization)
    company_email = company_email.trim().toLowerCase();
    // Remove spaces from phone number
    company_phone = company_phone.trim();
    // If industry exists → trim spaces
    // If it doesn't exist → set it as an empty string
    company_industry = company_industry ? company_industry.trim() : "";

    // Validate email format using validator library
    if (!validator.isEmail(company_email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    // Validate phone number using validator library
    // "any" allows international phone numbers
    if (!validator.isMobilePhone(company_phone, "any")) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid mobile number" });
    }

    // Destructure individual address fields from company_address object
    const {
      address_line_1,
      address_line_2,
      address_line_3,
      address_line_4,
      city,
      state,
      country,
      zipcode,
    } = company_address;

    // Validate required address fields
    if (!address_line_1 || !city || !state || !country || !zipcode) {
      return res
        .status(400)
        .json({ success: false, message: "Required address fields missing1" });
    }

    // Remove extra spaces from all the address field
    company_address.address_line_1 = address_line_1.trim();
    company_address.address_line_2 = address_line_2.trim();
    company_address.address_line_3 = address_line_3.trim();
    company_address.address_line_4 = address_line_4.trim();
    company_address.city = city.trim();
    company_address.state = state.trim();
    company_address.country = country.trim();
    company_address.zipcode = zipcode.trim();

    // Search the database for an existing company with the same email
    // and that is not marked as deleted
    const company = await Company.findOne({
      company_email,
      isDeleted: false,
    });

    // If a company with the same email already exists
    if (company) {
      return res.status(400).json({
        success: false,
        message: "Company Already Exists with this email address!",
      });
    }

    // Create a new company document using mongoose model
    const newCompany = new Company({
      company_name,
      company_email,
      company_phone,
      company_address,
      company_industry,
      ownerId, // Associate company with the logged-in user
    });

    // Save the company document to MongoDB
    const savedCompany = await newCompany.save();

    req.user.companyId = savedCompany._id;
    await req.user.save();

    // Send success response with the created company data
    return res.status(201).json({
      success: true,
      message: "Company Created Successfully!",
      company: savedCompany,
    });
  } catch (error) {
    // Catch any server errors and send a response
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Export the createCompany controller function
// so it can be used in route files
module.exports = {
  createCompany,
};
