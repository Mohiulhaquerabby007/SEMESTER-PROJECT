const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  calculateFare,
  cancelOrder,
} = require("../controllers/orderController");

router.post("/",           protect, createOrder);
router.get("/",            protect, getMyOrders);
router.post("/price",      protect, calculateFare);
router.get("/:id",         protect, getOrderById);
router.patch("/:id/cancel", protect, cancelOrder);

module.exports = router;
