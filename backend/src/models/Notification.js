const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId:   { type: mongoose.Schema.Types.ObjectId, required: true },
    recipientType: { type: String, enum: ["user", "rider"], required: true },
    title:         { type: String, required: true },
    body:          { type: String, required: true },
    isRead:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for fast per-user queries
notificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
