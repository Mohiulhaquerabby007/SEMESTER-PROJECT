require("dotenv").config();
const express = require("express");
const http    = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://flexypay-82d33.web.app",
      "https://flexypay-82d33.firebaseapp.com",
      "https://flexypay-82d3382d33.web.app",
      "https://flexypay-82d3382d33.firebaseapp.com"
    ],
    methods: ["GET","POST"],
  },
});

// Make io accessible from controllers
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join_order_room", (orderId) => {
    socket.join(orderId);
  });

  socket.on("join_user_room", (userId) => {
    socket.join(userId);
  });

  socket.on("send_message", async ({ orderId, senderId, senderModel, text }) => {
    const msg = { orderId, senderId, senderModel, text, createdAt: new Date() };
    io.to(orderId).emit("receive_message", msg);
    try {
      const Message = require("./models/Message");
      await Message.create({ order: orderId, sender: senderId, senderModel, text });
    } catch {}
  });
});

try {
  const admin = require("firebase-admin");
  const fs = require("fs");
  const path = require("path");

  // Look in different locations for the service account file
  const possiblePaths = [
    path.join(__dirname, "config", "firebase-service-account.json"), // Local src/config
    path.join(process.cwd(), "firebase-service-account.json"),       // Root (Render Secret File)
    "/etc/secrets/firebase-service-account.json"                    // Render standard secret path
  ];

  let serviceAccount;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      serviceAccount = require(p);
      console.log(`✅ Loading Firebase credentials from: ${p}`);
      break;
    }
  }

  if (serviceAccount) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("🔥 Firebase Admin initialized");
  } else {
    throw new Error("Service account file not found in any expected location");
  }
} catch (err) {
  console.log("⚠️ Firebase Admin not initialized:", err.message);
}

app.use(cors({
  origin: [
    "http://localhost:5174",
    "https://flexypay-82d33.web.app",
    "https://flexypay-82d33.firebaseapp.com",
    "https://flexypay-82d3382d33.web.app",
    "https://flexypay-82d3382d33.firebaseapp.com"
  ],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/auth",          require("./routes/auth"));
app.use("/api/orders",        require("./routes/orders"));
app.use("/api/riders",        require("./routes/riders"));
app.use("/api/admin",         require("./routes/admin"));
app.use("/api/chat",          require("./routes/chat"));
app.use("/api/coupons",       require("./routes/coupon"));
app.use("/api/notifications", require("./routes/notification"));

app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: Date.now() }));

app.get("/api/force-seed", async (req, res) => {
  try {
    const { autoSeedIfEmpty } = require("./config/db");
    const User  = require("./models/User");
    const Rider = require("./models/Rider");
    const Order = require("./models/Order");
    await Promise.all([User.deleteMany({}), Rider.deleteMany({}), Order.deleteMany({})]);
    await autoSeedIfEmpty();
    res.json({ message: "✅ Force seed complete! 6 users, 5 riders, 60 orders created." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const dropLegacyIndexes = async () => {
  const mongoose = require("mongoose");
  const db = mongoose.connection.db;
  if (!db) return;

  const drops = [
    { col: "users",  index: "phone_1",          label: "phone_1 unique index from users" },
    { col: "orders", index: "clientOrderId_1",   label: "clientOrderId_1 non-sparse index from orders" },
  ];

  for (const { col, index, label } of drops) {
    try {
      const collection = db.collection(col);
      const existing = await collection.indexes();
      if (existing.find((i) => i.name === index)) {
        await collection.dropIndex(index);
        console.log(`✅ Dropped legacy ${label}`);
      }
    } catch (e) {
      console.log(`ℹ️  No legacy ${label} to drop:`, e.message);
    }
  }
};

connectDB().then(async () => {
  await dropLegacyIndexes();
  const PORT = process.env.PORT || 5005;
  server.listen(PORT, "0.0.0.0", () => console.log(`QuickDrop API + Socket.io running on port ${PORT}`));
});
