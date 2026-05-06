const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");
const {
  getPendingOrders,
  getMyDeliveries,
  acceptOrder,
  updateOrderStatus,
  getEarnings,
  getProfile,
  updateAvailability,
} = require("../controllers/riderController");

router.use(protect, roleGuard("rider"));

router.get("/profile",       getProfile);
router.get("/pending",       getPendingOrders);
router.get("/deliveries",    getMyDeliveries);
router.get("/earnings",      getEarnings);
router.patch("/availability", updateAvailability);
router.patch("/:id/accept",  acceptOrder);
router.patch("/:id/status",  updateOrderStatus);

module.exports = router;
