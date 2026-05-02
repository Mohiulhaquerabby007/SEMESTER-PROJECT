const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  registerUser,
  loginUser,
  registerRider,
  loginRider,
  getProfile,
  updateProfilePic,
  updateFcmToken,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/rider/register", registerRider);
router.post("/rider/login", loginRider);
router.get("/profile", protect, getProfile);
router.patch("/profile-pic", protect, updateProfilePic);
router.post("/update-fcm-token", protect, updateFcmToken);

module.exports = router;
