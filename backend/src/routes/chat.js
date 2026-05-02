const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const { getMessages, sendMessage } = require("../controllers/chatController");

router.use(protect);

router.get("/:orderId", getMessages);
router.post("/:orderId", sendMessage);

module.exports = router;
