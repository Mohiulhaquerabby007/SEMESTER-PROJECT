const User         = require("../models/User");
const Rider        = require("../models/Rider");
const Notification = require("../models/Notification");

exports.sendNotification = async (req, res) => {
  try {
    const { targetType, title, body, userId } = req.body;

    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    let allUsers  = [];
    let allRiders = [];

    if (targetType === "users") {
      allUsers = await User.find({}).select("_id fcmToken");
    } else if (targetType === "riders") {
      allRiders = await Rider.find({}).select("_id fcmToken");
    } else if (targetType === "specific" && userId) {
      let target = await User.findById(userId).select("_id fcmToken");
      if (target) allUsers.push(target);
      else {
        target = await Rider.findById(userId).select("_id fcmToken");
        if (target) allRiders.push(target);
      }
    } else {
      [allUsers, allRiders] = await Promise.all([
        User.find({}).select("_id fcmToken"),
        Rider.find({}).select("_id fcmToken"),
      ]);
    }

    const t = title.trim();
    const b = body.trim();

    const notifDocs = [
      ...allUsers.map((u) => ({ recipientId: u._id, recipientType: "user",  title: t, body: b })),
      ...allRiders.map((r) => ({ recipientId: r._id, recipientType: "rider", title: t, body: b })),
    ];

    if (notifDocs.length > 0) {
      await Notification.insertMany(notifDocs);
      
      // Real-time socket emission
      const io = req.app.get("io");
      if (io) {
        notifDocs.forEach(notif => {
          io.to(notif.recipientId.toString()).emit("new_notification", notif);
        });
      }
    }

    const realTokens = [...allUsers, ...allRiders]
      .map((d) => d.fcmToken)
      .filter((tok) => tok && !tok.startsWith("web_"));

    if (realTokens.length === 0) {
      return res.json({
        message: "Notification saved to inbox for all recipients. No FCM push sent (no native tokens registered).",
        successCount: 0,
        failureCount: 0,
        savedToInbox: notifDocs.length,
      });
    }

    let admin;
    try { admin = require("firebase-admin"); } catch {
      return res.json({
        message: "Notification saved to inbox. Firebase Admin not installed.",
        savedToInbox: notifDocs.length,
        successCount: 0,
        failureCount: 0,
      });
    }

    if (!admin.apps.length) {
      return res.json({
        message: "Notification saved to inbox. Firebase Admin not initialized.",
        savedToInbox: notifDocs.length,
        successCount: 0,
        failureCount: 0,
      });
    }

    const response = await admin.messaging().sendEachForMulticast({
      notification: { title: t, body: b },
      tokens: realTokens,
    });

    const invalidTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success && r.error?.code === "messaging/registration-token-not-registered") {
        invalidTokens.push(realTokens[i]);
      }
    });
    if (invalidTokens.length > 0) {
      await Promise.all([
        User.updateMany({ fcmToken: { $in: invalidTokens } },  { $set: { fcmToken: null } }),
        Rider.updateMany({ fcmToken: { $in: invalidTokens } }, { $set: { fcmToken: null } }),
      ]);
    }

    res.json({
      message: "Notifications dispatched and saved to inbox",
      successCount: response.successCount,
      failureCount:  response.failureCount,
      expiredCleaned: invalidTokens.length,
      savedToInbox: notifDocs.length,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── User/Rider: Get their notification inbox ───────────────────── */
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── User/Rider: Mark notification(s) as read ───────────────────── */
exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === "all") {
      await Notification.updateMany({ recipientId: req.user._id }, { isRead: true });
    } else {
      await Notification.findByIdAndUpdate(id, { isRead: true });
    }
    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── User/Rider: Delete notification(s) ─────────────────────────── */
exports.deleteNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === "all") {
      await Notification.deleteMany({ recipientId: req.user._id });
    } else {
      await Notification.findByIdAndDelete(id);
    }
    res.json({ message: "Notifications deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
