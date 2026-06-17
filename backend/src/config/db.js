const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");
const fs   = require("fs");

let _memServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    const isPlaceholder = !uri || uri.includes("<username>") || uri.includes("xxxxx");

    if (isPlaceholder) {
      console.log("Placeholder URI detected — starting local in-memory MongoDB…");
      _memServer = await MongoMemoryServer.create();
      uri = _memServer.getUri();
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    await autoSeedIfEmpty();
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    console.log("Falling back to in-memory MongoDB…");
    try {
      const persistDir = path.join(__dirname, "../../.mongo-persist");
      if (!fs.existsSync(persistDir)) fs.mkdirSync(persistDir, { recursive: true });

      _memServer = await MongoMemoryServer.create({
        instance: { dbPath: persistDir, storageEngine: "wiredTiger" },
      });
      const conn = await mongoose.connect(_memServer.getUri());
      console.log(`Fallback MongoDB Connected: ${conn.connection.host} (persistent)`);
      await autoSeedIfEmpty();
    } catch (fallbackError) {
      try {
        _memServer = await MongoMemoryServer.create();
        const conn = await mongoose.connect(_memServer.getUri());
        console.log(`Fallback MongoDB Connected: ${conn.connection.host} (ephemeral)`);
        await autoSeedIfEmpty();
      } catch (finalError) {
        console.error(`Fallback MongoDB Error: ${finalError.message}`);
        process.exit(1);
      }
    }
  }
};

const autoSeedIfEmpty = async () => {
  try {
    const User  = require("../models/User");
    const Rider = require("../models/Rider");
    const Order = require("../models/Order");
    const Coupon = require("../models/Coupon");

    const count = await User.countDocuments();
    if (count > 0) return;

    console.log("🌱 Empty database — auto-seeding test data…");

    const USERS = [
      { name: "Admin User",    email: "admin@quickdrop.com", phone: "01700000000", password: "admin1234", role: "admin",  address: "HQ, Motijheel, Dhaka" },
      { name: "Mohiul Haque",  email: "mohiul@test.com",     phone: "01700000001", password: "test1234",  role: "user",   address: "Mirpur-10, Dhaka" },
      { name: "Rahim Uddin",   email: "rahim@test.com",      phone: "01700000002", password: "test1234",  role: "user",   address: "Gulshan-2, Dhaka" },
      { name: "Fatima Begum",  email: "fatima@test.com",     phone: "01700000003", password: "test1234",  role: "user",   address: "Dhanmondi, Dhaka" },
      { name: "Kamal Hossain", email: "kamal@test.com",      phone: "01700000004", password: "test1234",  role: "user",   address: "Uttara, Dhaka" },
      { name: "Nusrat Jahan",  email: "nusrat@test.com",     phone: "01700000005", password: "test1234",  role: "user",   address: "Banani, Dhaka" },
      { name: "Sajid Hasan",   email: "sajid@test.com",      phone: "01700000006", password: "test1234",  role: "user",   address: "Badda, Dhaka" },
      { name: "Riya Akter",    email: "riya@test.com",       phone: "01700000007", password: "test1234",  role: "user",   address: "Rampura, Dhaka" },
    ];
    const RIDERS = [
      { name: "Rubel Ahmed",  email: "rubel@rider.com",  phone: "01800000001", password: "test1234", vehicleType: "motorcycle", totalEarnings: 12400, completedDeliveries: 48 },
      { name: "Jamal Sheikh", email: "jamal@rider.com",  phone: "01800000002", password: "test1234", vehicleType: "motorcycle", totalEarnings: 9800,  completedDeliveries: 37 },
      { name: "Mizan Rahman", email: "mizan@rider.com",  phone: "01800000003", password: "test1234", vehicleType: "car",        totalEarnings: 18200, completedDeliveries: 62 },
      { name: "Sharif Ali",   email: "sharif@rider.com", phone: "01800000004", password: "test1234", vehicleType: "car",        totalEarnings: 7600,  completedDeliveries: 25 },
      { name: "Hasan Kabir",  email: "hasan@rider.com",  phone: "01800000005", password: "test1234", vehicleType: "bicycle",    totalEarnings: 5200,  completedDeliveries: 19 },
    ];
    const COUPONS = [
      { code: "WELCOME50",  alias: "Welcome Discount",   discountType: "percentage", discountValue: 50,  maxUses: 100, expiryDate: new Date(Date.now() + 30 * 86400000) },
      { code: "FLAT100",    alias: "Flat ৳100 Off",       discountType: "fixed",      discountValue: 100, maxUses: 50,  expiryDate: new Date(Date.now() + 15 * 86400000) },
      { code: "FESTIVAL20", alias: "Festival Special",    discountType: "percentage", discountValue: 20,  maxUses: 200, expiryDate: new Date(Date.now() + 7 * 86400000) },
    ];
    const ADDRESSES = [
      "Mirpur-10, Dhaka","Gulshan-2, Dhaka","Dhanmondi-27, Dhaka","Uttara, Dhaka",
      "Motijheel, Dhaka","Banani, Dhaka","Mohakhali, Dhaka","Farmgate, Dhaka",
      "Badda, Dhaka","Rampura, Dhaka","Tejgaon, Dhaka","Khilgaon, Dhaka",
    ];
    const STATUSES = ["pending","accepted","picked_up","in_transit","delivered","delivered","delivered","delivered","cancelled"];
    const TYPES    = ["document","small","medium","large"];
    const rand     = (a) => a[Math.floor(Math.random() * a.length)];
    const randInt  = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;

    const users  = await User.create(USERS);
    const riders = await Rider.create(RIDERS);
    const coupons = await Coupon.create(COUPONS);
    const nonAdmin = users.filter((u) => u.role === "user");

    const rawOrders = [];
    for (let i = 0; i < 80; i++) {
      const user = rand(nonAdmin), rider = rand(riders);
      const status = rand(STATUSES), parcelType = rand(TYPES);
      const distance = randInt(2, 22), weight = randInt(1, 12);
      const price = 60 + distance * 15 + { document: 0, small: 10, medium: 25, large: 50 }[parcelType] + Math.max(0, weight - 5) * 5;
      const createdAt = new Date(Date.now() - randInt(0, 29) * 86400000 - randInt(0, 86400000));
      rawOrders.push({
        user: user._id, rider: ["pending","cancelled"].includes(status) ? null : rider._id,
        pickupAddress: rand(ADDRESSES), pickupPhone: user.phone,
        dropoffAddress: rand(ADDRESSES), dropoffPhone: `017${randInt(10000000,99999999)}`,
        parcelType, weight, distance, price, status,
        clientOrderId: `auto_${i}_${Date.now()}`,
        createdAt, updatedAt: createdAt,
      });
    }
    await Order.collection.insertMany(rawOrders);

    console.log(`✅ Auto-seed complete: ${users.length} users, ${riders.length} riders, ${rawOrders.length} orders, ${coupons.length} coupons`);
    console.log("   Admin login → admin@quickdrop.com / admin1234");
    console.log("   User  login → mohiul@test.com / test1234");
    console.log("   Rider login → rubel@rider.com / test1234");
  } catch (err) {
    console.error("Auto-seed error (non-fatal):", err.message);
  }
};

module.exports = connectDB;
module.exports.autoSeedIfEmpty = autoSeedIfEmpty;
