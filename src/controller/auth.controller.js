const validator = require("validator");
const User = require("../modal/user.modal.js");
const Company = require("../modal/company.model.js");
const { hashPassword, comparePassword } = require("../utils/password.utils.js");
const generateToken = require("../utils/token.utils.js");
const { default: mongoose } = require("mongoose");

const registerUser = async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    if (
      !first_name?.trim() ||
      !last_name?.trim() ||
      !email?.trim() ||
      !password?.trim()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All Field Are Required" });
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
      isDeleted: false,
    });

    if (user) {
      return res
        .status(409)
        .json({ success: false, message: "User Already Exists" });
    }

    const hashedPassword = await hashPassword(passwordTrim);

    const newUser = await User.create({
      first_name: firstName,
      last_name: lastName,
      email: emailNormalize,
      password: hashedPassword,
    });

    const savedUser = {
      _id: newUser._id,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      email: newUser.email,
    };

    return res.status(201).json({
      success: true,
      message: "User Register Successfully!",
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

const loginUser = async (req, res) => {
  try {
    const { email, password, slug } = req.body;
    if (!email?.trim() || !password?.trim() || !slug?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Slug, Email and Password are required",
      });
    }
    const emailNormalize = email?.trim().toLowerCase();
    const passwordTrim = password?.trim();
    const slugTrim = slug.trim().toLowerCase();

    if (!validator.isEmail(emailNormalize)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email",
      });
    }

    const company = await Company.findOne({
      slug: slugTrim,
      isDeleted: false,
      isActive: true,
    }).lean();

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    const user = await User.findOne({
      email: emailNormalize,
      companyId: company._id,
      isDeleted: false,
    }).select("+password");

    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isPasswordMatch = await comparePassword(passwordTrim, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken({
      userId: user._id,
      email: user.email,
      roleId: user.roleId,
      companyId: user.companyId,
    });

    const userData = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      roleId: user.roleId,
      companyId: user.companyId,
      slug: company.slug,
    };

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      token,
      data: userData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const companyId = req.user.companyId;
    const loggedInUserId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid User Id" });
    }
    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized Access" });
    }
    if (loggedInUserId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only change your own password",
      });
    }
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All Fields Are Required" });
    }

    const oldPasswordTrim = oldPassword.trim();
    const newPasswordTrim = newPassword.trim();
    const confirmPasswordTrim = confirmPassword.trim();

    if (!oldPasswordTrim || !newPasswordTrim || !confirmPasswordTrim) {
      return res
        .status(400)
        .json({ success: false, message: "All Fields Are Required" });
    }

    if (newPasswordTrim.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Passwod cannot exceed 128 characters",
      });
    }

    if (
      !validator.isStrongPassword(newPasswordTrim, {
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

    if (newPasswordTrim !== confirmPasswordTrim) {
      return res.status(400).json({
        success: false,
        message: "New Password did not match with confirm password",
      });
    }

    const user = await User.findOne({
      _id: userId,
      companyId,
    })
      .active()
      .select("+password");

    if (!user) {
      return res.status(404).json({ success: false, message: "No user found" });
    }

    const isMatch = await comparePassword(oldPasswordTrim, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Old password is incorrect" });
    }

    const isSamePassword = await comparePassword(
      newPasswordTrim,
      user.password,
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
    }

    const hashedPassword = await hashPassword(newPasswordTrim);

    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  changePassword,
};
