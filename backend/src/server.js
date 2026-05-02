require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const riderRoutes = require("./routes/riders");
const adminRoutes = require("./routes/admin");

const app = express();

// Initialize Firebase Admin (Wrapped in try/catch to prevent crashing if file is missing)
try {
  const admin = require("firebase-admin");
  const serviceAccount = require("./config/firebase-service-account.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("🔥 Firebase Admin initialized successfully");
} catch (error) {
  console.log("⚠️ Firebase Admin NOT initialized: Ensure backend/src/config/firebase-service-account.json exists");
}

connectDB().then(async () => {
  try {
    const User = require("./models/User");
    const Rider = require("./models/Rider");
    const Order = require("./models/Order");
    const Message = require("./models/Message");
    
    const count = await User.countDocuments();
    if (count === 0) {
      console.log("🌱 Auto-seeding empty database...");
      await seedDatabase(User, Rider, Order, Message);
      console.log("✅ Auto-seed complete!");
    } else {
      console.log(`✅ Database has ${count} users — skipping seed.`);
    }
  } catch (err) { console.error("Auto-seed error:", err.message); }
});

async function seedDatabase(User, Rider, Order, Message) {
  await Promise.all([User.deleteMany({}), Rider.deleteMany({}), Order.deleteMany({}), Message.deleteMany({})]);

  const USERS = [
    { name: "Admin User",     email: "admin@quickdrop.com", phone: "01700000000", password: "admin1234", role: "admin",  address: "HQ Office, Motijheel, Dhaka" },
    { name: "Mohiul Haque",   email: "mohiul@test.com",     phone: "01700000001", password: "test1234",  role: "user",   address: "Mirpur-10, Dhaka" },
    { name: "Rahim Uddin",    email: "rahim@test.com",      phone: "01700000002", password: "test1234",  role: "user",   address: "Gulshan-2, Dhaka" },
    { name: "Fatima Begum",   email: "fatima@test.com",     phone: "01700000003", password: "test1234",  role: "user",   address: "Dhanmondi-27, Dhaka" },
    { name: "Kamal Hossain",  email: "kamal@test.com",      phone: "01700000004", password: "test1234",  role: "user",   address: "Uttara Sector-7, Dhaka" },
    { name: "Nusrat Jahan",   email: "nusrat@test.com",     phone: "01700000005", password: "test1234",  role: "user",   address: "Banani, Dhaka" },
  ];

  const RIDERS = [
    { name: "Rubel Ahmed",  email: "rubel@rider.com",  phone: "01800000001", password: "test1234", vehicleType: "bike", totalEarnings: 12400, completedDeliveries: 48 },
    { name: "Jamal Sheikh", email: "jamal@rider.com",  phone: "01800000002", password: "test1234", vehicleType: "bike", totalEarnings: 9800,  completedDeliveries: 37 },
    { name: "Mizan Rahman", email: "mizan@rider.com",  phone: "01800000003", password: "test1234", vehicleType: "car",  totalEarnings: 18200, completedDeliveries: 62 },
    { name: "Sharif Ali",   email: "sharif@rider.com", phone: "01800000004", password: "test1234", vehicleType: "van",  totalEarnings: 7600,  completedDeliveries: 25 },
    { name: "Hasan Kabir",  email: "hasan@rider.com",  phone: "01800000005", password: "test1234", vehicleType: "bike", totalEarnings: 5200,  completedDeliveries: 19 },
  ];

  const ADDRESSES = [
    "Mirpur-10, Dhaka", "Gulshan-2, Dhaka", "Dhanmondi-27, Dhaka",
    "Uttara Sector-7, Dhaka", "Motijheel, Dhaka", "Banani, Dhaka",
    "Mohakhali, Dhaka", "Farmgate, Dhaka", "Badda, Dhaka", "Rampura, Dhaka",
  ];

  const users = await User.create(USERS);
  const riders = await Rider.create(RIDERS);
  const nonAdminUsers = users.filter((u) => u.role === "user");
  const rawOrders = [];
  const STATUSES = ["pending","accepted","picked_up","in_transit","delivered","delivered","delivered","cancelled"];
  const PARCEL_TYPES = ["document","small","medium","large"];
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  for (let i = 0; i < 60; i++) {
    const user = rand(nonAdminUsers);
    const rider = rand(riders);
    const status = rand(STATUSES);
    const parcelType = rand(PARCEL_TYPES);
    const distance = randInt(2, 25);
    const weight = randInt(1, 12);
    const wtCharge = { document: 0, small: 10, medium: 25, large: 50 }[parcelType];
    const price = 60 + distance * 15 + wtCharge + Math.max(0, weight - 5) * 5;
    const createdAt = new Date(Date.now() - randInt(0, 14) * 86400000);
    rawOrders.push({
      user: user._id, rider: ["pending","cancelled"].includes(status) ? null : rider._id,
      pickupAddress: rand(ADDRESSES), pickupPhone: user.phone,
      dropoffAddress: rand(ADDRESSES), dropoffPhone: `017${randInt(10000000, 99999999)}`,
      parcelType, weight, distance, price, status,
      clientOrderId: `seed_${i}_${Date.now()}`,
      createdAt, updatedAt: createdAt,
    });
  }
  await Order.collection.insertMany(rawOrders);
}

app.use(cors());
app.use(express.json());

app.get("/api/force-seed", async (req, res) => {
  try {
    const User = require("./models/User");
    const Rider = require("./models/Rider");
    const Order = require("./models/Order");
    const Message = require("./models/Message");
    await seedDatabase(User, Rider, Order, Message);
    res.json({ message: "✅ Force seed complete! 6 users, 5 riders, 60 orders created." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/riders", riderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", require("./routes/chat"));
app.use("/api/coupons", require("./routes/coupon"));
app.use("/api/notifications", require("./routes/notification"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`QuickDrop API running on port ${PORT}`);
});
