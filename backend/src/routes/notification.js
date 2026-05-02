const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const { sendNotification } = require("../controllers/notificationController");

router.post("/send", protect, sendNotification);

module.exports = router;
