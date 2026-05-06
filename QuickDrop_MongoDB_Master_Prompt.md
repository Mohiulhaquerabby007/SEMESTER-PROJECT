# QuickDrop — MongoDB Database Master Prompt

## Role
You are an Expert MongoDB Database Engineer and Mongoose ODM specialist. Design and implement a production-ready database layer for the QuickDrop parcel delivery platform. Write clean, optimized, comment-free code using CommonJS syntax.

---

## Project Context
QuickDrop has three user roles — **Customer**, **Rider**, **Admin** — and one core transaction entity — **Order**. The frontend is offline-first, meaning orders can be created without internet and synced later. The database must handle deduplication, role-based access, and financial tracking.

---

## Technology
| Tool | Purpose |
|---|---|
| MongoDB Atlas | Cloud-hosted primary database |
| Mongoose | ODM (schema enforcement, validation, middleware) |
| mongodb-memory-server | In-memory fallback for development |
| dotenv | Load `MONGO_URI` from `.env` |

---

## Collections Overview

| Collection | Model File | Purpose |
|---|---|---|
| `users` | `User.js` | Customer accounts |
| `riders` | `Rider.js` | Delivery personnel accounts |
| `orders` | `Order.js` | Parcel delivery transactions |

---

## File: `src/config/db.js`

### Behavior
1. Read `MONGO_URI` from `.env`.
2. If URI contains placeholder text (`<username>`, `<pass>`, `xxxxx`) — skip Atlas and boot `mongodb-memory-server` immediately.
3. Otherwise attempt `mongoose.connect(MONGO_URI)`.
4. If connection throws — catch the error, log it, and fall back to `mongodb-memory-server`.
5. Log either `MongoDB Connected: <host>` or `Running in-memory fallback (data resets on restart)`.

### Code Pattern
```js
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    if (!uri || uri.includes("<") || uri.includes("xxxxx")) {
      const mem = await MongoMemoryServer.create();
      uri = mem.getUri();
      console.log("Running in-memory fallback (data resets on restart)");
    }
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB Error: ${err.message}`);
    const mem = await MongoMemoryServer.create();
    const conn = await mongoose.connect(mem.getUri());
    console.log(`Fallback active: ${conn.connection.host}`);
  }
};

module.exports = connectDB;
```

---

## Schema 1: `src/models/User.js`

### Purpose
Stores customer accounts. Customers book parcels and track deliveries.

### Fields

| Field | Type | Constraints | Default |
|---|---|---|---|
| `name` | String | required, trim | — |
| `email` | String | required, unique, lowercase, trim | — |
| `password` | String | required, minlength: 6, select: false | — |
| `phone` | String | required | — |
| `role` | String | enum: `['user', 'admin']` | `'user'` |
| `isBlocked` | Boolean | — | `false` |
| `fcmToken` | String | nullable, stored when device registers for push | `null` |
| `createdAt` | Date | auto (timestamps) | — |
| `updatedAt` | Date | auto (timestamps) | — |

### Indexes
- `email` — unique index (enforced by `unique: true` in schema)

### Schema Options
- `{ timestamps: true }`

### Mongoose Pre-Save Hook
- Before saving, if `password` is modified: hash it with `bcrypt` at cost factor **12**.

### Instance Method
- `matchPassword(enteredPassword)` — returns `bcrypt.compare(enteredPassword, this.password)`

### Full Schema Definition
```js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true, minlength: 6, select: false },
    phone:     { type: String, required: true },
    role:      { type: String, enum: ["user", "admin"], default: "user" },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", userSchema);
```

---

## Schema 2: `src/models/Rider.js`

### Purpose
Stores delivery rider accounts. Riders accept orders, update delivery status, and accumulate earnings.

### Fields

| Field | Type | Constraints | Default |
|---|---|---|---|
| `name` | String | required, trim | — |
| `email` | String | required, unique, lowercase, trim | — |
| `password` | String | required, minlength: 6, select: false | — |
| `phone` | String | required | — |
| `vehicleType` | String | enum: `['bicycle','motorcycle','car']`, required | — |
| `isAvailable` | Boolean | — | `true` |
| `isBlocked` | Boolean | — | `false` |
| `totalEarnings` | Number | min: 0 | `0` |
| `completedDeliveries` | Number | min: 0 | `0` |
| `fcmToken` | String | nullable, stored when device registers for push | `null` |
| `createdAt` | Date | auto | — |
| `updatedAt` | Date | auto | — |

### Indexes
- `email` — unique index

### Schema Options
- `{ timestamps: true }`

### Mongoose Pre-Save Hook
- Same bcrypt password hashing as User (cost factor 12).

### Instance Method
- `matchPassword(enteredPassword)` — same as User model.

### Full Schema Definition
```js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const riderSchema = new mongoose.Schema(
  {
    name:                 { type: String, required: true, trim: true },
    email:                { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:             { type: String, required: true, minlength: 6, select: false },
    phone:                { type: String, required: true },
    vehicleType:          { type: String, enum: ["bicycle", "motorcycle", "car"], required: true },
    isAvailable:          { type: Boolean, default: true },
    isBlocked:            { type: Boolean, default: false },
    totalEarnings:        { type: Number, default: 0, min: 0 },
    completedDeliveries:  { type: Number, default: 0, min: 0 },
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

module.exports = mongoose.model("Rider", riderSchema);
```

---

## Schema 3: `src/models/Order.js`

### Purpose
The core transaction document. Tracks every parcel from booking to delivery. Supports offline-first creation via `clientOrderId` deduplication.

### Fields

| Field | Type | Constraints | Default |
|---|---|---|---|
| `clientOrderId` | String | unique, sparse | — |
| `user` | ObjectId (ref: User) | required | — |
| `rider` | ObjectId (ref: Rider) | — | `null` |
| `pickupAddress` | String | required, trim | — |
| `pickupPhone` | String | required | — |
| `dropoffAddress` | String | required, trim | — |
| `dropoffPhone` | String | required | — |
| `discountType` | String | enum: `['percentage','fixed']` | `'percentage'` |
| `discountValue` | Number | required | — |
| `maxUses` | Number | default: 1 | — |
| `usedCount` | Number | default: 0 | — |
| `isActive` | Boolean | default: true | — |
| `expiryDate` | Date | required | — |
| `alias` | String | optional human‑readable name for the campaign | `""` |
| `status` | String | enum: see below | `'pending'` |
| `couponCode` | String | optional applied coupon identifier | `null` |
| `createdAt` | Date | auto | — |
| `updatedAt` | Date | auto | — |

### Status Enum (Ordered State Machine)
```
'pending' → 'accepted' → 'picked_up' → 'in_transit' → 'delivered'
                                                      → 'cancelled'  (only from 'pending')
```

### Indexes
| Field(s) | Type | Reason |
|---|---|---|
| `clientOrderId` | unique + sparse | Offline dedup; sparse = ignore null values |
| `user` | standard | Fast lookup of a customer's orders |
| `rider` | standard | Fast lookup of a rider's assigned deliveries |
| `status` | standard | Admin filters, rider pending-order queries |
| `createdAt` | descending | Sort orders newest-first efficiently |

### Full Schema Definition
```js
const mongoose = require("mongoose");

const ORDER_STATUSES = ["pending", "accepted", "picked_up", "in_transit", "delivered", "cancelled"];

const orderSchema = new mongoose.Schema(
  {
    clientOrderId:  { type: String, unique: true, sparse: true },
    user:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rider:          { type: mongoose.Schema.Types.ObjectId, ref: "Rider", default: null },
    pickupAddress:  { type: String, required: true, trim: true },
    pickupPhone:    { type: String, required: true },
    dropoffAddress: { type: String, required: true, trim: true },
    dropoffPhone:   { type: String, required: true },
    parcelType:     { type: String, enum: ["document", "small", "medium", "large"], required: true },
    weight:         { type: Number, required: true, min: 0.1 },
    distance:       { type: Number, required: true, min: 0.1 },
    notes:          { type: String, trim: true, default: "" },
    price:          { type: Number, required: true, min: 0 },
    status:         { type: String, enum: ORDER_STATUSES, default: "pending" },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1 });
orderSchema.index({ rider: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
```

---

## Data Relationships

```
users ──────────────────────────────┐
  _id ──► orders.user (ObjectId)    │  One user → many orders
                                    │
riders ─────────────────────────────┤
  _id ──► orders.rider (ObjectId)   │  One rider → many assigned orders
                                    │
orders ─────────────────────────────┘
  clientOrderId  → dedup key from frontend (UUID)
  status         → state machine field
  price          → pre-calculated at creation time
```

**Population Paths (for API responses):**
- `Order.populate('user', 'name email phone')` — show customer info on order
- `Order.populate('rider', 'name phone vehicleType')` — show rider info on order

---

## Admin Dashboard Aggregation

Use MongoDB Aggregation Pipeline on the `orders` collection for KPIs:

```js
const stats = await Order.aggregate([
  {
    $facet: {
      totalOrders:      [{ $count: "count" }],
      totalRevenue:     [{ $match: { status: "delivered" } }, { $group: { _id: null, sum: { $sum: "$price" } } }],
      activeDeliveries: [{ $match: { status: { $in: ["accepted", "picked_up", "in_transit"] } } }, { $count: "count" }],
    },
  },
]);
```

Combine with separate `User.countDocuments()` and `Rider.countDocuments()` calls.

---

## Offline-First Deduplication Logic

When a customer books while offline, the frontend generates a UUID (`clientOrderId`) and stores it in Dexie.js. On sync, `POST /api/orders` is called.

**Database-level protection in the controller:**
```js
const existing = await Order.findOne({ clientOrderId, user: req.user.id });
if (existing) return res.status(200).json(existing);
```

The `sparse: true` on the `clientOrderId` index ensures documents without this field (older orders) do not cause index conflicts.

---

## Financial Business Rules (Enforce at DB Write Time)

| Event | DB Operation |
|---|---|
| Order delivered | `Rider.findByIdAndUpdate(riderId, { $inc: { totalEarnings: price * 0.8, completedDeliveries: 1 }, isAvailable: true })` |
| Rider accepts order | `Order.findByIdAndUpdate(id, { rider: riderId, status: 'accepted' })` — only if `rider === null` |
| Order cancelled | Only allowed when `status === 'pending'` — enforce in controller before update |

---

## `.env` Template
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/quickdrop?retryWrites=true&w=majority
JWT_SECRET=<generate-with: openssl rand -hex 32>
JWT_EXPIRES_IN=7d
```

> **Tip:** The database name `quickdrop` is set in the URI. MongoDB Atlas will create it automatically on first write.

---

## MongoDB Atlas Setup Checklist
- [ ] Create a free M0 cluster on [cloud.mongodb.com](https://cloud.mongodb.com)
- [ ] Add a database user with read/write access
- [ ] Whitelist IP `0.0.0.0/0` (dev) or your server IP (prod)
- [ ] Copy the connection string into `.env` as `MONGO_URI`
- [ ] Replace `<password>` with your DB user's password (URL-encode special characters)

---

## Coding Rules
- CommonJS only (`require` / `module.exports`).
- No comments in code.
- No logic inside model files beyond schema definition, pre-save hooks, and instance methods.
- All queries use `async/await`.
- Never return `password` in any query result — use `select: false` on the field and never `.select('+password')` except during login.
