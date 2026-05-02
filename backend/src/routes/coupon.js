const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const {
  createCoupon,
  getAllCoupons,
  deleteCoupon,
  validateCoupon,
} = require("../controllers/couponController");

// Admin routes
router.post("/", protect, createCoupon);
router.get("/", protect, getAllCoupons);
router.delete("/:id", protect, deleteCoupon);

// User route to validate coupon
router.post("/validate", protect, validateCoupon);

module.exports = router;
