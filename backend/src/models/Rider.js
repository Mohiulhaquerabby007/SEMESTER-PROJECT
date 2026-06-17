const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const riderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    vehicleType: {
      type: String,
      enum: ["bicycle", "motorcycle", "car"],
      default: "motorcycle",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedDeliveries: {
      type: Number,
      default: 0,
      min: 0,
    },
    profilePic: {
      type: String,
      default: "",
    },
    fcmToken: {
      type: String,
      default: null,
    },
    nidImage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

riderSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

riderSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

riderSchema.methods.comparePassword = riderSchema.methods.matchPassword;

module.exports = mongoose.model("Rider", riderSchema);
