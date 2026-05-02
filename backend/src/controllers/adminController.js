const User = require("../models/User");
const Rider = require("../models/Rider");
const Order = require("../models/Order");

// ── Dashboard KPIs ──────────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const [totalOrders, activeDeliveries, totalUsers, totalRiders, deliveredOrders] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: { $in: ["accepted", "picked_up", "in_transit"] } }),
        User.countDocuments({ role: "user" }),
        Rider.countDocuments(),
        Order.find({ status: "delivered" }).select("price"),
      ]);
    const totalRevenue = deliveredOrders.reduce((s, o) => s + o.price, 0);
    res.json({ totalOrders, activeDeliveries, totalUsers, totalRiders, totalRevenue });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Analytics (revenue trend + order trend + status dist) ────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const days = Number(req.query.days) || 14;
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    const [revenueTrend, orderTrend, statusDist] = await Promise.all([
      Order.aggregate([
        { $match: { status: "delivered", createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$price" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    res.json({ revenueTrend, orderTrend, statusDist });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Top riders leaderboard ───────────────────────────────────────────────────
exports.getTopRiders = async (req, res) => {
  try {
    const riders = await Rider.find({ isBlocked: { $ne: true } })
      .sort({ completedDeliveries: -1, totalEarnings: -1 })
      .limit(5)
      .select("name vehicleType totalEarnings completedDeliveries isAvailable phone");
    res.json(riders);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Orders (paginated, filterable, searchable) ───────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 15 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { pickupAddress: { $regex: search, $options: "i" } },
        { dropoffAddress: { $regex: search, $options: "i" } },
      ];
    }
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name phone email")
        .populate("rider", "name phone vehicleType")
        .sort({ createdAt: -1 })
        .skip((page - 1) * Number(limit))
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);
    res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Users (searchable) ───────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { role: "user" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    const users = await User.find(filter).sort({ createdAt: -1 });
    // Attach order count
    const withOrders = await Promise.all(
      users.map(async (u) => {
        const count = await Order.countDocuments({ user: u._id });
        return { ...u.toObject(), orderCount: count };
      })
    );
    res.json(withOrders);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Riders (searchable) ──────────────────────────────────────────────────────
exports.getAllRiders = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    const riders = await Rider.find(filter).sort({ completedDeliveries: -1 });
    res.json(riders);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// ── Block / Unblock ──────────────────────────────────────────────────────────
exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ message: `User ${user.isBlocked ? "blocked" : "unblocked"}`, user });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.toggleBlockRider = async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id);
    if (!rider) return res.status(404).json({ message: "Rider not found" });
    rider.isBlocked = !rider.isBlocked;
    await rider.save();
    res.json({ message: `Rider ${rider.isBlocked ? "blocked" : "unblocked"}`, rider });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.overrideOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createRider = async (req, res) => {
  try {
    const { name, email, phone, password, vehicleType } = req.body;
    const exists = await Rider.findOne({ $or: [{ email }, { phone }] });
    if (exists) return res.status(400).json({ message: "Rider already exists" });
    const rider = await Rider.create({ name, email, phone, password, vehicleType });
    res.status(201).json(rider);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteRider = async (req, res) => {
  try {
    const rider = await Rider.findByIdAndDelete(req.params.id);
    if (!rider) return res.status(404).json({ message: "Rider not found" });
    res.json({ message: "Rider deleted successfully" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getLeaderboards = async (req, res) => {
  try {
    const topRiders = await Rider.find({ isBlocked: { $ne: true } })
      .sort({ totalEarnings: -1 })
      .limit(5)
      .select("name totalEarnings profilePic vehicleType");

    const topUsers = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: "$user", totalSpent: { $sum: "$price" }, count: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userInfo" } },
      { $unwind: "$userInfo" },
      { $project: { _id: 1, totalSpent: 1, count: 1, name: "$userInfo.name", profilePic: "$userInfo.profilePic" } }
    ]);

    res.json({ topRiders, topUsers });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
