const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");
const {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getPrice,
} = require("../controllers/orderController");

router.post("/", protect, roleGuard("user"), createOrder);
router.get("/", protect, roleGuard("user"), getUserOrders);
router.post("/price", protect, getPrice);
router.get("/:id", protect, getOrderById);
router.patch("/:id/cancel", protect, roleGuard("user"), cancelOrder);

module.exports = router;
