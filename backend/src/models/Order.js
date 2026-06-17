const mongoose = require("mongoose");

const ORDER_STATUSES = ["pending", "accepted", "picked_up", "in_transit", "delivered", "cancelled"];

const orderSchema = new mongoose.Schema(
  {
    clientOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
      default: null,
    },
    pickupAddress: {
      type: String,
      required: [true, "Pickup address is required"],
      trim: true,
    },
    pickupPhone: {
      type: String,
      required: [true, "Pickup phone is required"],
    },
    dropoffAddress: {
      type: String,
      required: [true, "Drop-off address is required"],
      trim: true,
    },
    dropoffPhone: {
      type: String,
      required: [true, "Drop-off phone is required"],
    },
    parcelType: {
      type: String,
      enum: ["document", "small", "medium", "large"],
      required: true,
    },
    weight: {
      type: Number,
      required: [true, "Weight is required"],
      min: 0.1,
    },
    distance: {
      type: Number,
      required: [true, "Distance is required"],
      min: 0.1,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
    },
    couponCode: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1 });
orderSchema.index({ rider: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
