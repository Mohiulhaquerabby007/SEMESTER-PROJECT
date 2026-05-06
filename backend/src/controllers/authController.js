const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Rider = require("../models/Rider");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/* ── standard auth ───────────────────────────────────────────────── */

exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });
    const user = await User.create({ name, email, phone, password, address });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    if (user.isBlocked) return res.status(403).json({ message: "Account blocked" });
    
    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.registerRider = async (req, res) => {
  try {
    const { name, email, phone, password, vehicleType, nidImage } = req.body;
    const exists = await Rider.findOne({ email });
    if (exists) return res.status(400).json({ message: "Rider already exists" });
    const rider = await Rider.create({ name, email, phone, password, vehicleType, nidImage });
    res.status(201).json({
      _id: rider._id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      vehicleType: rider.vehicleType,
      role: "rider",
      token: generateToken(rider._id, "rider"),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginRider = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });
    const rider = await Rider.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!rider) return res.status(401).json({ message: "Invalid credentials" });
    const match = await bcrypt.compare(password, rider.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });
    if (rider.isBlocked) return res.status(403).json({ message: "Account blocked" });
    res.json({
      _id: rider._id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      vehicleType: rider.vehicleType,
      role: "rider",
      token: generateToken(rider._id, "rider"),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ── Google Sign‑In ─────────────────────────────────────────────── */

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Google token is required" });

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        message: "Google login is not configured. Add GOOGLE_CLIENT_ID to .env",
      });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const email = payload.email?.toLowerCase();
    const name  = payload.name || email.split("@")[0];

    if (!email) return res.status(400).json({ message: "Google account has no email" });

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Auto‑create a social account — password is random (user can set one later)
      const randomPass  = crypto.randomBytes(20).toString("hex");
      // Use a guaranteed-unique placeholder so the (possibly still-indexed) phone field
      // never causes a duplicate key error across multiple Google sign-ins
      const phonePlaceholder = `google_${payload.sub}`;
      user = await User.create({
        name,
        email,
        phone: phonePlaceholder,
        password: randomPass,
        address: "",
        profilePic: payload.picture || "",
        role: "user",
      });
    }

    if (user.isBlocked)
      return res.status(403).json({ message: "Account blocked" });

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePic: user.profilePic,
      isGoogleAccount: true,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    // Return 400 so the interceptor doesn't auto-redirect, allowing the frontend to see the toast
    res.status(400).json({ message: "Google sign-in failed: " + error.message });
  }
};

/* ── profile helpers ─────────────────────────────────────────────── */

exports.getProfile = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role || req.accountType,
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

exports.updateProfileDetails = async (req, res) => {
  try {
    const Model = req.accountType === "rider" ? Rider : User;
    const { phone, address } = req.body;
    
    // Only update fields that are provided
    const updates = {};
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    const account = await Model.findByIdAndUpdate(req.user._id, updates, { new: true });
    
    res.json({ 
      message: "Profile updated successfully", 
      phone: account.phone,
      address: account.address 
    });
  } catch (error) {
    // Handle duplicate phone number error
    if (error.code === 11000 && error.keyPattern?.phone) {
      return res.status(400).json({ message: "Phone number is already in use by another account" });
    }
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

exports.updateRiderNid = async (req, res) => {
  try {
    const { nidImage } = req.body;
    if (!nidImage) return res.status(400).json({ message: "NID image is required" });
    const rider = await Rider.findByIdAndUpdate(req.user._id, { nidImage }, { new: true });
    res.json({ message: "NID image updated successfully", nidImage: rider.nidImage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
