const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderModel: { type: String, enum: ["User", "Rider"], required: true },
  text: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
