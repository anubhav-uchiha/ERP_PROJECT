const Company = require("../modal/company.model.js");
const validator = require("validator");

const createCompany = async (req, res) => {
  try {
    const ownerId = req.user._id;
    let {
      company_name,
      company_email,
      company_phone,
      company_address,
      company_industry,
    } = req.body;

    if (req.user.companyId) {
      return res
        .status(400)
        .json({ success: false, message: "User already owns a company" });
    }

    if (
      !company_name?.trim() ||
      !company_email?.trim() ||
      !company_phone?.trim() ||
      !company_address
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All Field Are Required!" });
    }

    if (typeof company_address !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "Company address is required" });
    }

    company_name = company_name.trim();
    company_email = company_email.trim().toLowerCase();
    company_phone = company_phone.trim();
    company_industry = company_industry ? company_industry.trim() : "";

    if (!validator.isEmail(company_email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    if (!validator.isMobilePhone(company_phone, "any")) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid mobile number" });
    }

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

    if (!address_line_1 || !city || !state || !country || !zipcode) {
      return res
        .status(400)
        .json({ success: false, message: "Required address fields missing1" });
    }

    company_address.address_line_1 = address_line_1.trim();
    company_address.address_line_2 = address_line_2.trim();
    company_address.address_line_3 = address_line_3.trim();
    company_address.address_line_4 = address_line_4.trim();
    company_address.city = city.trim();
    company_address.state = state.trim();
    company_address.country = country.trim();
    company_address.zipcode = zipcode.trim();

    const company = await Company.findOne({
      company_email,
      isDeleted: false,
    });

    if (company) {
      return res.status(400).json({
        success: false,
        message: "Company Already Exists with this email address!",
      });
    }

    const newCompany = new Company({
      company_name,
      company_email,
      company_phone,
      company_address,
      company_industry,
      ownerId,
    });

    const savedCompany = await newCompany.save();

    req.user.companyId = savedCompany._id;
    await req.user.save();

    return res.status(201).json({
      success: true,
      message: "Company Created Successfully!",
      company: savedCompany,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCompany,
};
