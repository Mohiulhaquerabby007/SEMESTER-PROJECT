const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");
const {
  createCoupon,
  getAllCoupons,
  deleteCoupon,
  validateCoupon,
} = require("../controllers/couponController");

router.post("/", protect, roleGuard("admin"), createCoupon);
router.get("/", protect, roleGuard("admin"), getAllCoupons);
router.delete("/:id", protect, roleGuard("admin"), deleteCoupon);

router.post("/validate", protect, validateCoupon);

module.exports = router;
