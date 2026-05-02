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
} = require("../controllers/riderController");

router.get("/pending", protect, roleGuard("rider"), getPendingOrders);
router.get("/deliveries", protect, roleGuard("rider"), getMyDeliveries);
router.patch("/:id/accept", protect, roleGuard("rider"), acceptOrder);
router.patch("/:id/status", protect, roleGuard("rider"), updateOrderStatus);
router.get("/earnings", protect, roleGuard("rider"), getEarnings);

module.exports = router;
