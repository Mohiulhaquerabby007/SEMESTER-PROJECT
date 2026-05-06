const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
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
    },
    pickupPhone: {
      type: String,
      required: [true, "Pickup phone is required"],
    },
    dropoffAddress: {
      type: String,
      required: [true, "Drop-off address is required"],
    },
    dropoffPhone: {
      type: String,
      required: [true, "Drop-off phone is required"],
    },
    parcelType: {
      type: String,
      enum: ["document", "small", "medium", "large"],
      default: "small",
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
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "picked_up", "in_transit", "delivered", "cancelled"],
      default: "pending",
    },
    clientOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    notes: {
      type: String,
      default: "",
    },
    couponCode: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ rider: 1, status: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model("Order", orderSchema);
