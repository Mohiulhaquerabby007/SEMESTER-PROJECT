const User = require("../models/User");
const Rider = require("../models/Rider");

exports.sendNotification = async (req, res) => {
  try {
    // Only admin can send bulk notifications
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { targetType, title, body, userId } = req.body;
    // targetType: 'all', 'users', 'riders', 'specific'

    let targetTokens = [];

    const fetchTokens = async (Model, query = {}) => {
      const accounts = await Model.find({ ...query, fcmToken: { $ne: null } });
      return accounts.map(a => a.fcmToken);
    };

    if (targetType === "users") {
      targetTokens = await fetchTokens(User);
    } else if (targetType === "riders") {
      targetTokens = await fetchTokens(Rider);
    } else if (targetType === "all") {
      const [u, r] = await Promise.all([fetchTokens(User), fetchTokens(Rider)]);
      targetTokens = [...u, ...r];
    } else if (targetType === "specific" && userId) {
      let targetUser = await User.findById(userId);
      if (!targetUser) targetUser = await Rider.findById(userId);
      
      if (targetUser && targetUser.fcmToken) {
        targetTokens.push(targetUser.fcmToken);
      }
    }

    if (targetTokens.length === 0) {
      return res.status(400).json({ message: "No valid push tokens found for the selected target" });
    }

    let admin;
    try {
      admin = require("firebase-admin");
    } catch(err) {
      return res.status(500).json({ message: "Firebase admin SDK not installed or configured on the server." });
    }

    if (admin.apps.length === 0) {
      return res.status(500).json({ message: "Firebase admin is not initialized." });
    }

    // Send multicast
    const message = {
      notification: { title, body },
      tokens: targetTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    res.json({
      message: "Notifications sent successfully",
      successCount: response.successCount,
      failureCount: response.failureCount
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
