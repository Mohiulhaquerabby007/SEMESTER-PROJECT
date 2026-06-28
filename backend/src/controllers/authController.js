const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const Rider = require("../models/Rider");
const { uploadToImageBB } = require("../utils/imagebb");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/* ── standard auth ───────────────────────────────────────────────── */

exports.registerUser = async (req, res) => {
  try {
    // Validation already handled by validators middleware
    const { name, email, phone, password, address } = req.body;
    const cleanName  = (name || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPhone = (phone || "").trim();

    const exists = await User.findOne({ email: cleanEmail });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const phoneExists = await User.findOne({ phone: cleanPhone });
    if (phoneExists) return res.status(400).json({ message: "Phone number is already in use by another user account" });

    const user = await User.create({ name: cleanName, email: cleanEmail, phone: cleanPhone, password, address });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePic: user.profilePic || "",
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Brute-force lockout check
    const MAX_ATTEMPTS = 5;
    const LOCK_TIME_MS = 30 * 60 * 1000; // 30 minutes

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // If lock expired, reset counters
    if (user.lockUntil && user.lockUntil <= Date.now()) {
      user.loginAttempts = 0;
      user.lockUntil = null;
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      }
      await user.save();

      const remaining = MAX_ATTEMPTS - user.loginAttempts;
      if (remaining > 0) {
        return res.status(401).json({ message: `Invalid credentials. ${remaining} attempt(s) remaining.` });
      }
      return res.status(423).json({ message: "Account locked due to too many failed attempts. Try again in 30 minutes." });
    }

    if (user.isBlocked) return res.status(403).json({ message: "Account blocked" });

    // Successful login — reset lockout counters
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePic: user.profilePic || "",
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.registerRider = async (req, res) => {
  try {
    // Validation already handled by validators middleware
    const { name, email, phone, password, vehicleType, nidImage } = req.body;
    const cleanName    = (name || "").trim();
    const cleanEmail   = (email || "").trim().toLowerCase();
    const cleanPhone   = (phone || "").trim();
    const cleanVehicle = (vehicleType || "").trim().toLowerCase();

    // Check if rider already exists by email
    const exists = await Rider.findOne({ email: cleanEmail });
    if (exists) return res.status(400).json({ message: "Rider already exists with this email" });

    // Check if phone number is already registered by another rider
    const phoneExists = await Rider.findOne({ phone: cleanPhone });
    if (phoneExists) return res.status(400).json({ message: "Phone number is already in use by another rider account" });

    // Upload NID Image to ImageBB and retrieve hosted URL
    let uploadedNidUrl;
    try {
      uploadedNidUrl = await uploadToImageBB(nidImage);
    } catch (uploadError) {
      return res.status(400).json({ message: uploadError.message });
    }

    // Create Rider with the uploaded ImageBB URL
    const rider = await Rider.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password,
      vehicleType: cleanVehicle,
      nidImage: uploadedNidUrl,
    });

    res.status(201).json({
      _id: rider._id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      vehicleType: rider.vehicleType,
      profilePic: rider.profilePic,
      nidImage: rider.nidImage,
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

    const rider = await Rider.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!rider) return res.status(401).json({ message: "Invalid credentials" });

    // Brute-force lockout check
    const MAX_ATTEMPTS = 5;
    const LOCK_TIME_MS = 30 * 60 * 1000; // 30 minutes

    if (rider.lockUntil && rider.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((rider.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        message: `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // If lock expired, reset counters
    if (rider.lockUntil && rider.lockUntil <= Date.now()) {
      rider.loginAttempts = 0;
      rider.lockUntil = null;
    }

    const match = await bcrypt.compare(password, rider.password);
    if (!match) {
      rider.loginAttempts = (rider.loginAttempts || 0) + 1;
      if (rider.loginAttempts >= MAX_ATTEMPTS) {
        rider.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      }
      await rider.save();

      const remaining = MAX_ATTEMPTS - rider.loginAttempts;
      if (remaining > 0) {
        return res.status(401).json({ message: `Invalid credentials. ${remaining} attempt(s) remaining.` });
      }
      return res.status(423).json({ message: "Account locked due to too many failed attempts. Try again in 30 minutes." });
    }

    if (rider.isBlocked) return res.status(403).json({ message: "Account blocked" });

    // Successful login — reset lockout counters
    rider.loginAttempts = 0;
    rider.lockUntil = null;
    await rider.save();

    res.json({
      _id: rider._id,
      name: rider.name,
      email: rider.email,
      phone: rider.phone,
      vehicleType: rider.vehicleType,
      profilePic: rider.profilePic,
      nidImage: rider.nidImage,
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
    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    // Determine if it is a base64 string or already a URL
    let uploadedPicUrl = profilePic;
    if (profilePic.includes(";base64,") || !profilePic.startsWith("http")) {
      try {
        uploadedPicUrl = await uploadToImageBB(profilePic);
      } catch (uploadError) {
        return res.status(400).json({ message: uploadError.message });
      }
    }

    const account = await Model.findByIdAndUpdate(
      req.user._id,
      { profilePic: uploadedPicUrl },
      { new: true }
    );
    res.json({ message: "Profile picture updated", profilePic: account.profilePic });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfileDetails = async (req, res) => {
  try {
    const Model = req.accountType === "rider" ? Rider : User;
    const { phone, address } = req.body;
    
    // Only update whitelisted fields that are provided (prevents mass-assignment)
    const updates = {};
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (address !== undefined) updates.address = String(address).trim();

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

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

    // Upload the updated NID Image to ImageBB
    let uploadedNidUrl;
    try {
      uploadedNidUrl = await uploadToImageBB(nidImage);
    } catch (uploadError) {
      return res.status(400).json({ message: uploadError.message });
    }

    const rider = await Rider.findByIdAndUpdate(
      req.user._id,
      { nidImage: uploadedNidUrl },
      { new: true }
    );
    res.json({ message: "NID image updated successfully", nidImage: rider.nidImage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
