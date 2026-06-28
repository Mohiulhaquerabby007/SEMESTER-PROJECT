const express    = require("express");
const router     = express.Router();
const rateLimit  = require("express-rate-limit");
const protect    = require("../middleware/auth");
const {
  validateRegisterUser,
  validateRegisterRider,
  validateLogin,
  validateProfileUpdate,
  validateProfilePic,
  validateGoogleLogin,
} = require("../middleware/validators");
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

/* ── Strict rate limiter for auth endpoints ────────────────────────── */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                  // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again after 15 minutes" },
});

/* ── routes ────────────────────────────────────────────────────────── */
router.post("/register",        authLimiter, validateRegisterUser,  registerUser);
router.post("/login",           authLimiter, validateLogin,         loginUser);
router.post("/rider/register",  authLimiter, validateRegisterRider, registerRider);
router.post("/rider/login",     authLimiter, validateLogin,         loginRider);
router.post("/google-login",    authLimiter, validateGoogleLogin,   googleLogin);

router.get("/profile",            protect, getProfile);
router.patch("/profile-pic",      protect, validateProfilePic,    updateProfilePic);
router.patch("/profile-details",  protect, validateProfileUpdate, updateProfileDetails);
router.patch("/fcm-token",        protect, updateFcmToken);
router.post("/update-fcm-token",  protect, updateFcmToken);
router.patch("/rider/nid",        protect, updateRiderNid);

module.exports = router;
