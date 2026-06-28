/**
 * Input-validation middleware using express-validator.
 *
 * Each export is an array of validation chains + a final handler that
 * returns 400 with a list of errors if any chain fails.
 */

const { body, validationResult } = require("express-validator");

/* ── helper: collect errors ────────────────────────────────────────── */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,          // first human-readable error
      errors:  errors.array().map((e) => e.msg), // all errors
    });
  }
  next();
};

/* ── shared field rules ────────────────────────────────────────────── */
const nameRules = () =>
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters")
    .matches(/^[a-zA-Z\s.\-']+$/).withMessage("Name contains invalid characters");

const emailRules = () =>
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail();

const phoneRules = () =>
  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .matches(/^(?:\+?88)?01[3-9]\d{8}$/).withMessage("Please provide a valid 11-digit BD phone number");

const passwordRules = () =>
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6, max: 128 }).withMessage("Password must be 6-128 characters");

/* ── register: user ────────────────────────────────────────────────── */
exports.validateRegisterUser = [
  nameRules(),
  emailRules(),
  phoneRules(),
  passwordRules(),
  body("address")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Address must be under 200 characters"),
  handleValidationErrors,
];

/* ── register: rider ───────────────────────────────────────────────── */
exports.validateRegisterRider = [
  nameRules(),
  emailRules(),
  phoneRules(),
  passwordRules(),
  body("vehicleType")
    .trim()
    .notEmpty().withMessage("Vehicle type is required")
    .isIn(["bicycle", "motorcycle", "car", "bike", "van"])
    .withMessage("Invalid vehicle type"),
  body("nidImage")
    .notEmpty().withMessage("NID image is required for rider registration")
    .isString().withMessage("NID image must be a string"),
  handleValidationErrors,
];

/* ── login (shared by user & rider) ────────────────────────────────── */
exports.validateLogin = [
  emailRules(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6, max: 128 }).withMessage("Password must be at least 6 characters"),
  handleValidationErrors,
];

/* ── profile update ────────────────────────────────────────────────── */
exports.validateProfileUpdate = [
  body("phone")
    .optional()
    .trim()
    .matches(/^(?:\+?88)?01[3-9]\d{8}$/).withMessage("Invalid phone number"),
  body("address")
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage("Address must be under 200 characters"),
  handleValidationErrors,
];

/* ── profile picture ───────────────────────────────────────────────── */
exports.validateProfilePic = [
  body("profilePic")
    .notEmpty().withMessage("Profile picture is required")
    .isString().withMessage("Profile picture must be a string")
    .custom((value) => {
      // Allow hosted URLs or base64 strings
      if (value.startsWith("http://") || value.startsWith("https://")) return true;
      if (value.includes(";base64,") || /^[A-Za-z0-9+/=]+$/.test(value.slice(0, 100))) return true;
      throw new Error("Profile picture must be a valid URL or base64 image");
    }),
  handleValidationErrors,
];

/* ── Google login ──────────────────────────────────────────────────── */
exports.validateGoogleLogin = [
  body("token")
    .notEmpty().withMessage("Google token is required")
    .isString().withMessage("Token must be a string"),
  handleValidationErrors,
];
