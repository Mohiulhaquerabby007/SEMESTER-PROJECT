const express = require("express");
const router  = express.Router();
const protect  = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");
const {
  sendNotification,
  getMyNotifications,
  markRead,
  deleteNotifications,
} = require("../controllers/notificationController");

// Admin: send a notification broadcast
router.post("/send", protect, roleGuard("admin"), sendNotification);

router.get("/my",           protect, getMyNotifications);
router.patch("/read/all",   protect, (req, res, next) => { req.params.id = "all"; next(); }, markRead);
router.patch("/read/:id",   protect, markRead);

router.delete("/delete/all", protect, (req, res, next) => { req.params.id = "all"; next(); }, deleteNotifications);
router.delete("/delete/:id", protect, deleteNotifications);

module.exports = router;
