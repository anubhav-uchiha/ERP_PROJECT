const mongoose = require("mongoose");
const User = require("../modal/user.modal.js");
const Role = require("../modal/role.model.js");
const validator = require("validator");
const { hashPassword, comparePassword } = require("../utils/password.utils");

const createEmployee = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { first_name, last_name, email, password, roleId } = req.body;

    if (!companyId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized Access" });
    }

    if (
      !first_name?.trim() ||
      !last_name?.trim() ||
      !email?.trim() ||
      !password?.trim() ||
      !roleId
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All Field Are Required" });
    }

    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role id" });
    }

    const firstName = first_name?.trim();
    const lastName = last_name?.trim();
    const emailNormalize = email?.trim().toLowerCase();
    const passwordTrim = password?.trim();

    if (!validator.isEmail(emailNormalize)) {
      return res
        .status(400)
        .json({ success: false, message: "Email is not valid!" });
    }

    if (
      !validator.isStrongPassword(passwordTrim, {
        minLength: 8,
        minLowercase: 1,
        minNumbers: 1,
        minUppercase: 1,
        minSymbols: 1,
      })
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include upper case character, lower case character, number and symbol",
      });
    }

    const user = await User.findOne({
      email: emailNormalize,
      companyId,
      isDeleted: false,
    });

    if (user) {
      return res
        .status(409)
        .json({ success: false, message: "User Already Exists" });
    }

    const role = await Role.findOne({
      _id: roleId,
      companyId,
      isDeleted: false,
      isActive: true,
    });

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const hashedPassword = await hashPassword(passwordTrim);

    const newUser = await User.create({
      first_name: firstName,
      last_name: lastName,
      email: emailNormalize,
      password: hashedPassword,
      roleId,
      companyId: companyId,
    });

    const savedUser = {
      _id: newUser._id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
      roleId: newUser.roleId,
      companyId: newUser.companyId,
    };

    return res.status(201).json({
      success: true,
      message: "Employee Created Successfully!",
      data: savedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const employeeId = req.param.id;

    const companyId = req.user.companyId;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid employee id" });
    }

    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "Unauthorized Access" });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid compnay id" });
    }

    const employee = await User.findOne({ employeeId });

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    return res.status(200).json({
      success: true,
      message: " Emplyoee Fetched Successfully",
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  createEmployee,
  getEmployeeById,
};
