require("dotenv").config();
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../models/User");
const Rider = require("../models/Rider");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");

const USERS = [
  { name: "Admin User",     email: "admin@quickdrop.com", phone: "01700000000", password: "admin1234", role: "admin",  address: "HQ Office, Motijheel, Dhaka" },
  { name: "Mohiul Haque",   email: "mohiul@test.com",     phone: "01700000001", password: "test1234",  role: "user",   address: "Mirpur-10, Dhaka" },
  { name: "Rahim Uddin",    email: "rahim@test.com",      phone: "01700000002", password: "test1234",  role: "user",   address: "Gulshan-2, Dhaka" },
  { name: "Fatima Begum",   email: "fatima@test.com",     phone: "01700000003", password: "test1234",  role: "user",   address: "Dhanmondi-27, Dhaka" },
  { name: "Kamal Hossain",  email: "kamal@test.com",      phone: "01700000004", password: "test1234",  role: "user",   address: "Uttara Sector-7, Dhaka" },
  { name: "Nusrat Jahan",   email: "nusrat@test.com",     phone: "01700000005", password: "test1234",  role: "user",   address: "Banani, Dhaka" },
  { name: "Sajid Hasan",    email: "sajid@test.com",      phone: "01700000006", password: "test1234",  role: "user",   address: "Badda, Dhaka" },
  { name: "Riya Akter",     email: "riya@test.com",       phone: "01700000007", password: "test1234",  role: "user",   address: "Rampura, Dhaka" },
];

const RIDERS = [
  { name: "Rubel Ahmed",  email: "rubel@rider.com",  phone: "01800000001", password: "test1234", vehicleType: "bike", totalEarnings: 12400, completedDeliveries: 48 },
  { name: "Jamal Sheikh", email: "jamal@rider.com",  phone: "01800000002", password: "test1234", vehicleType: "bike", totalEarnings: 9800,  completedDeliveries: 37 },
  { name: "Mizan Rahman", email: "mizan@rider.com",  phone: "01800000003", password: "test1234", vehicleType: "car",  totalEarnings: 18200, completedDeliveries: 62 },
  { name: "Sharif Ali",   email: "sharif@rider.com", phone: "01800000004", password: "test1234", vehicleType: "van",  totalEarnings: 7600,  completedDeliveries: 25 },
  { name: "Hasan Kabir",  email: "hasan@rider.com",  phone: "01800000005", password: "test1234", vehicleType: "bike", totalEarnings: 5200,  completedDeliveries: 19 },
];

const COUPONS = [
  { code: "WELCOME50", discountType: "percentage", discountValue: 50, maxUses: 100, expiryDate: new Date(Date.now() + 30 * 86400000) },
  { code: "FLAT100", discountType: "fixed", discountValue: 100, maxUses: 50, expiryDate: new Date(Date.now() + 15 * 86400000) },
  { code: "FESTIVAL20", discountType: "percentage", discountValue: 20, maxUses: 200, expiryDate: new Date(Date.now() + 7 * 86400000) }
];

const ADDRESSES = [
  "Mirpur-10, Dhaka","Gulshan-2, Dhaka","Dhanmondi-27, Dhaka","Uttara Sector-7, Dhaka",
  "Motijheel, Dhaka","Banani, Dhaka","Mohakhali, Dhaka","Farmgate, Dhaka",
  "Badda, Dhaka","Rampura, Dhaka","Tejgaon, Dhaka","Khilgaon, Dhaka",
];

const STATUSES = ["pending","accepted","picked_up","in_transit","delivered","delivered","delivered","delivered","cancelled"];
const PARCEL_TYPES = ["document","small","medium","large"];
const rand = (a) => a[Math.floor(Math.random() * a.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seed = async () => {
  console.log("🌱 Seeding QuickDrop database...\n");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas");
  } catch {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    console.log("✅ Connected to in-memory MongoDB (Atlas unavailable)");
  }

  await Promise.all([User.deleteMany({}), Rider.deleteMany({}), Order.deleteMany({}), Coupon.deleteMany({})]);
  console.log("🗑️  Cleared existing data");

  const users  = await User.create(USERS);
  const riders = await Rider.create(RIDERS);
  const coupons = await Coupon.create(COUPONS);
  console.log(`👤 Created ${users.length} users`);
  console.log(`🏍️  Created ${riders.length} riders`);
  console.log(`🎟️  Created ${coupons.length} coupons`);

  const nonAdminUsers = users.filter((u) => u.role === "user");
  const rawOrders = [];

  for (let i = 0; i < 80; i++) {
    const user       = rand(nonAdminUsers);
    const rider      = rand(riders);
    const status     = rand(STATUSES);
    const parcelType = rand(PARCEL_TYPES);
    const distance   = randInt(2, 25);
    const weight     = randInt(1, 12);
    const wtCharge   = { document: 0, small: 10, medium: 25, large: 50 }[parcelType];
    const price      = 60 + distance * 15 + wtCharge + Math.max(0, weight - 5) * 5;
    const daysAgo    = randInt(0, 29);
    const createdAt  = new Date(Date.now() - daysAgo * 86400000 - randInt(0, 86400000));

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
  console.log(`📦 Created ${rawOrders.length} orders (last 30 days)`);

  console.log("\n═══════════════════════════════════");
  console.log("🎉 Seed complete! Test credentials:");
  console.log("   Admin:  admin@quickdrop.com / admin1234");
  console.log("   User:   mohiul@test.com     / test1234");
  console.log("   Rider:  rubel@rider.com     / test1234");
  console.log("═══════════════════════════════════\n");
  process.exit(0);
};

seed().catch((e) => { console.error(e); process.exit(1); });
