const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const { calculatePrice } = require("../utils/pricing");

exports.createOrder = async (req, res) => {
  try {
    const {
      pickupAddress, pickupPhone, dropoffAddress, dropoffPhone,
      parcelType, weight, distance, clientOrderId, notes, couponCode, price: clientPrice,
    } = req.body;

    if (clientOrderId) {
      const existing = await Order.findOne({ clientOrderId });
      if (existing) return res.json(existing);
    }

    let price = calculatePrice({ distance, parcelType, weight });

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && new Date(coupon.expiryDate) >= new Date() &&
          (coupon.maxUses === 0 || coupon.usedCount < coupon.maxUses)) {
        if (coupon.discountType === "percentage") {
          price = Math.max(0, Math.round(price - price * (coupon.discountValue / 100)));
        } else {
          price = Math.max(0, Math.round(price - coupon.discountValue));
        }
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      }
    }

    const order = await Order.create({
      user: req.user._id,
      pickupAddress, pickupPhone, dropoffAddress, dropoffPhone,
      parcelType, weight, distance, price, clientOrderId, notes,
      couponCode: couponCode || null,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("rider", "name phone vehicleType")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name phone email")
      .populate("rider", "name phone vehicleType");

    if (!order) return res.status(404).json({ message: "Order not found" });

    const userId = req.user._id.toString();
    const isOwner = order.user?._id?.toString() === userId;
    const isRider = order.rider?._id?.toString() === userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isRider && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.calculateFare = async (req, res) => {
  try {
    const { distance, parcelType, weight } = req.body;
    const price = calculatePrice({ distance, parcelType, weight });
    res.json({ price });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "pending") return res.status(400).json({ message: "Can only cancel pending orders" });
    order.status = "cancelled";
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserOrders = exports.getMyOrders;
exports.getPrice = exports.calculateFare;
