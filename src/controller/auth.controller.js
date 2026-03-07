const User = require("../modal/user.modal.js");
const hashPassword = require("../utils/password.utils.js");
const validator = require("validator");

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

    const firstName = first_name.trim();
    const lastName = last_name.trim();
    const emailNormalize = email.trim().toLowerCase();
    const passwordTrim = password.trim();

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

module.exports = {
  registerUser,
};
