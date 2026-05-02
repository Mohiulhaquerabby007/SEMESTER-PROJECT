const Order = require("../models/Order");
const { calculatePrice } = require("../utils/pricing");

exports.createOrder = async (req, res) => {
  try {
    const {
      pickupAddress,
      pickupPhone,
      dropoffAddress,
      dropoffPhone,
      parcelType,
      weight,
      distance,
      clientOrderId,
      notes,
    } = req.body;

    if (clientOrderId) {
      const existing = await Order.findOne({ clientOrderId, user: req.user._id });
      if (existing) {
        return res.json(existing);
      }
    }

    const price = calculatePrice(distance, weight, parcelType);

    const order = await Order.create({
      user: req.user._id,
      pickupAddress,
      pickupPhone,
      dropoffAddress,
      dropoffPhone,
      parcelType,
      weight,
      distance,
      price,
      clientOrderId,
      notes,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserOrders = async (req, res) => {
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

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Can only cancel pending orders" });
    }

    order.status = "cancelled";
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPrice = async (req, res) => {
  try {
    const { distance, weight, parcelType } = req.body;
    const price = calculatePrice(distance, weight, parcelType);
    res.json({ price });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
