const jwt = require("jsonwebtoken");
const User = require("../modal/user.modal.js");

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

    const user = await User.findById(decoded.userId).populate("roleId").lean();

    if (!user || user.isDeleted || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or inactive user" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Authentication failed",
    });
  }
};

module.exports = authenticate;
