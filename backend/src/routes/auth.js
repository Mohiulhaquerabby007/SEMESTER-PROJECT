const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  registerUser,
  loginUser,
  registerRider,
  loginRider,
  googleLogin,
  getProfile,
  updateProfilePic,
  updateProfileDetails,
  updateFcmToken,
  updateRiderNid,
} = require("../controllers/authController");

router.post("/register",           registerUser);
router.post("/login",              loginUser);
router.post("/rider/register",     registerRider);
router.post("/rider/login",        loginRider);
router.post("/google-login",       googleLogin);        // ← Google Sign‑In
router.get("/profile",             protect, getProfile);
router.patch("/profile-pic",       protect, updateProfilePic);
router.patch("/profile-details",   protect, updateProfileDetails);
router.post("/update-fcm-token",   protect, updateFcmToken);
router.patch("/rider/nid",         protect, updateRiderNid);

module.exports = router;
