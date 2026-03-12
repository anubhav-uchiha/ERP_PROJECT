const jwt = require("jsonwebtoken");
const User = require("../modal/user.modal.js");
const Company = require("../modal/company.model.js");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication token missing" });
    }
    const token = authHeader?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId)
      .populate({ path: "roleId", match: { isDeleted: false, isActive: true } })
      .lean();

    if (!user || user.isDeleted || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or inactive user" });
    }

    if (
      user.passwordChangedAt &&
      decoded.passwordChangedAt &&
      new Date(decoded.passwordChangedAt).getTime() !==
        new Date(user.passwordChangedAt).getTime()
    ) {
      return res.status(401).json({
        success: false,
        message: "Password changed recently. Please login again.",
      });
    }

    const company = await Company.findOne({
      _id: user.companyId,
      isDeleted: false,
      isActive: true,
    });

    if (!company) {
      return res.status(401).json({
        success: false,
        message: "Company not active",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

module.exports = authenticate;
