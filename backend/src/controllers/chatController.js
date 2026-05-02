const Message = require("../models/Message");
const Order = require("../models/Order");

exports.getMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    
    // Allow users, assigned riders, and admins
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== order.user.toString() &&
      req.user._id.toString() !== order.rider?.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized to view this chat" });
    }

    const messages = await Message.find({ order: orderId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.sendMessage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { text } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== order.user.toString() &&
      req.user._id.toString() !== order.rider?.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized to send messages here" });
    }

    const senderModel = req.accountType === "rider" ? "Rider" : "User";
    const msg = await Message.create({
      order: orderId,
      sender: req.user._id,
      senderModel,
      text
    });

    // Send push notification if firebase-admin is available
    try {
      const admin = require("firebase-admin");
      if (admin.apps.length > 0) {
        const receiverModel = req.accountType === "rider" ? require("../models/User") : require("../models/Rider");
        const receiverId = req.accountType === "rider" ? order.user : order.rider;
        
        if (receiverId) {
          const receiver = await receiverModel.findById(receiverId);
          if (receiver && receiver.fcmToken) {
            await admin.messaging().send({
              token: receiver.fcmToken,
              notification: {
                title: `New Message from ${req.accountType === "rider" ? "Rider" : "User"}`,
                body: text,
              },
              data: {
                route: req.accountType === "rider" ? `/user/orders/${orderId}` : `/rider/deliveries`,
                orderId: orderId.toString()
              }
            });
          }
        }
      }
    } catch (pushErr) {
      console.log("Push notification failed or not configured:", pushErr.message);
    }

    res.status(201).json(msg);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
