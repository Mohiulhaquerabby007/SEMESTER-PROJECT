const Order = require("../models/Order");
const Rider = require("../models/Rider");

exports.getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: "pending" })
      .populate("user", "name phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyDeliveries = async (req, res) => {
  try {
    const orders = await Order.find({ rider: req.user._id })
      .populate("user", "name phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order is no longer available" });
    }

    order.rider = req.user._id;
    order.status = "accepted";
    await order.save();

    await Rider.findByIdAndUpdate(req.user._id, { isAvailable: false });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validTransitions = {
      accepted: ["picked_up"],
      picked_up: ["in_transit"],
      in_transit: ["delivered"],
    };

    const order = await Order.findOne({
      _id: req.params.id,
      rider: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${order.status} to ${status}` });
    }

    order.status = status;
    await order.save();

    if (status === "delivered") {
      const riderEarning = Math.round(order.price * 0.8);
      await Rider.findByIdAndUpdate(req.user._id, {
        $inc: { totalEarnings: riderEarning, completedDeliveries: 1 },
        isAvailable: true,
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEarnings = async (req, res) => {
  try {
    const rider = await Rider.findById(req.user._id);
    res.json({
      totalEarnings: rider.totalEarnings,
      completedDeliveries: rider.completedDeliveries,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
