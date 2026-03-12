const express = require("express");
const {
  registerUser,
  loginUser,
  changePassword,
} = require("../controller/auth.controller");
const authorize = require("../middlewares/authorize");
const authenticate = require("../middlewares/authenticate");

const router = express.Router();

router.post("/registerUser", registerUser);
router.post("/loginUser", loginUser);
router.post(
  "/changePassword/:id",
  authenticate,
  authorize("USER", "UPDATE"),
  changePassword,
);

module.exports = router;
