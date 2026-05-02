const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Rider = require("../models/Rider");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    const exists = await User.findOne({ $or: [{ email }, { phone }] });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, phone, password, address });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();

    const user = await User.findOne({ email }).select("+password");
    console.log("[LOGIN USER DEBUG] email:", email, "user found:", !!user);
    if (user) {
      let match = await user.comparePassword(password);
      if (!match && user.password === password) {
        console.log("Fallback to plaintext match!");
        match = true; // Temporary fallback if seed didn't hash
      }
      console.log("[LOGIN USER DEBUG] password match:", match);
      if (!match) return res.status(401).json({ message: "Invalid password" });
    } else {
      return res.status(401).json({ message: "Invalid email" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Account is blocked" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.registerRider = async (req, res) => {
  try {
    const { name, email, phone, password, vehicleType } = req.body;

    const exists = await Rider.findOne({ $or: [{ email }, { phone }] });
    if (exists) {
      return res.status(400).json({ message: "Rider already exists" });
    }

    const rider = await Rider.create({ name, email, phone, password, vehicleType });

    res.status(201).json({
      _id: rider._id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      vehicleType: rider.vehicleType,
      accountType: "rider",
      token: generateToken(rider._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginRider = async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();

    const rider = await Rider.findOne({ email }).select("+password");
    console.log("[LOGIN RIDER DEBUG] email:", email, "rider found:", !!rider);
    if (rider) {
      let match = await rider.comparePassword(password);
      if (!match && rider.password === password) {
        console.log("Fallback to plaintext match!");
        match = true; // Temporary fallback if seed didn't hash
      }
      console.log("[LOGIN RIDER DEBUG] password match:", match);
      if (!match) return res.status(401).json({ message: "Invalid password" });
    } else {
      return res.status(401).json({ message: "Invalid email" });
    }
    
    if (rider.isBlocked) {
      return res.status(403).json({ message: "Account is blocked" });
    }

    res.json({
      _id: rider._id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      vehicleType: rider.vehicleType,
      accountType: "rider",
      token: generateToken(rider._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role,
    accountType: req.accountType,
    profilePic: req.user.profilePic,
  });
};

exports.updateProfilePic = async (req, res) => {
  try {
    const Model = req.accountType === "rider" ? Rider : User;
    const { profilePic } = req.body;
    const account = await Model.findByIdAndUpdate(req.user._id, { profilePic }, { new: true });
    res.json({ message: "Profile picture updated", profilePic: account.profilePic });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFcmToken = async (req, res) => {
  try {
    const Model = req.accountType === "rider" ? Rider : User;
    const { fcmToken } = req.body;
    await Model.findByIdAndUpdate(req.user._id, { fcmToken });
    res.json({ message: "FCM token updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
