# QuickDrop — Unified Backend & MongoDB Master Prompt

## Role
You are an Expert Backend Engineer specializing in Node.js, Express.js, MongoDB (Mongoose ODM), WebSockets (Socket.io), and REST API design. You write clean, secure, production-ready code without comments. 

---

## Project Context
You are building the complete backend (API server) for **QuickDrop** — a parcel delivery platform with three user roles: **Customer**, **Rider**, and **Admin**. 
The backend supports an offline-first frontend (React PWA) that syncs queued orders when connectivity is restored. It also supports real-time chat, push notifications via Firebase Cloud Messaging (FCM), a coupon discount system, and NID image uploads.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express.js |
| Database | MongoDB Atlas + Mongoose ODM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Real-Time | Socket.io |
| Push Notifications | Firebase Admin SDK |
| Dev DB Fallback | mongodb-memory-server |
| Environment | dotenv |

---

## Folder Structure (Strict — Do Not Deviate)

```text
backend/
├── .env
├── package.json
└── src/
    ├── server.js
    ├── config/
    │   ├── db.js
    │   └── firebase-service-account.json
    ├── models/
    │   ├── User.js
    │   ├── Rider.js
    │   ├── Order.js
    │   ├── Message.js
    │   ├── Coupon.js
    │   └── Notification.js
    ├── controllers/
    │   ├── authController.js
    │   ├── orderController.js
    │   ├── riderController.js
    │   ├── adminController.js
    │   ├── chatController.js
    │   ├── couponController.js
    │   └── notificationController.js
    ├── routes/
    │   ├── auth.js
    │   ├── orders.js
    │   ├── riders.js
    │   ├── admin.js
    │   ├── chat.js
    │   ├── coupon.js
    │   └── notification.js
    ├── middleware/
    │   ├── auth.js
    │   └── roleGuard.js
    └── utils/
        └── pricing.js
```

---

## Server Setup (`src/server.js`)
- Initialize `express`.
- Enable CORS for `http://localhost:3000` to `5174`.
- **CRITICAL:** Use `express.json({ limit: "10mb" })` and `express.urlencoded({ limit: "10mb", extended: true })` to support base64 NID image uploads.
- Mount routers: `/api/auth`, `/api/orders`, `/api/riders`, `/api/admin`, `/api/chat`, `/api/coupons`, `/api/notifications`.
- Provide an `/api/force-seed` endpoint for DB seeding with `autoSeedIfEmpty()`.
- Wrap the Express `app.listen` logic inside an `http.createServer()` and attach `socket.io` to it for chat features.
- Initialize `firebase-admin` with the local JSON credentials file.

---

## Database Connection (`src/config/db.js`)
- Attempt to connect to `process.env.MONGO_URI`.
- If URI contains `<password>` or the connection fails, instantiate `MongoMemoryServer` as a resilient fallback for development.
- Include a helper function `autoSeedIfEmpty()` that generates dummy users, riders, and 60 random orders if the database is completely empty.

---

## Mongoose Models

### 1. `User` (`src/models/User.js`)
| Field | Type | Constraints / Default |
|---|---|---|
| `name` | String | required, trim |
| `email` | String | required, unique, lowercase, trim |
| `password` | String | required (min 6 chars), select: false |
| `phone` | String | required |
| `profilePic` | String | base64 image (optional) |
| `role` | String | enum: `['user', 'admin']`, default: `'user'` |
| `isBlocked` | Boolean | default: false |
| `fcmToken` | String | null, stores Firebase push token |
*Hooks:* Hash `password` using bcrypt cost 12 before saving.
*Methods:* `matchPassword(entered)`.

### 2. `Rider` (`src/models/Rider.js`)
| Field | Type | Constraints / Default |
|---|---|---|
| `name` | String | required, trim |
| `email` | String | required, unique, lowercase, trim |
| `password` | String | required, select: false |
| `phone` | String | required |
| `profilePic` | String | base64 image (optional) |
| `nidPicture` | String | base64 image (optional) |
| `vehicleType` | String | enum: `['bicycle', 'motorcycle', 'car']` |
| `isAvailable` | Boolean | default: true |
| `isBlocked` | Boolean | default: false |
| `totalEarnings` | Number | default: 0 |
| `completedDeliveries` | Number | default: 0 |
| `fcmToken` | String | null, stores Firebase push token |
*Hooks:* Hash `password` using bcrypt cost 12 before saving.
*Methods:* `matchPassword(entered)`.

### 3. `Order` (`src/models/Order.js`)
| Field | Type | Constraints / Default |
|---|---|---|
| `clientOrderId` | String | unique, sparse (Offline deduplication) |
| `user` | ObjectId (User) | required |
| `rider` | ObjectId (Rider)| default: null |
| `pickupAddress` | String | required |
| `pickupPhone` | String | required |
| `dropoffAddress` | String | required |
| `dropoffPhone` | String | required |
| `parcelType` | String | enum: `['document', 'small', 'medium', 'large']` |
| `weight` | Number | required (kg) |
| `distance` | Number | required (km) |
| `notes` | String | optional |
| `price` | Number | required |
| `status` | String | enum: `['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled']` |
| `couponCode` | String | default: null |
*Indexes:* user, rider, status, createdAt.

### 4. `Coupon` (`src/models/Coupon.js`)
| Field | Type | Constraints / Default |
|---|---|---|
| `code` | String | required, unique, uppercase |
| `discountType` | String | enum: `['percentage', 'fixed']` |
| `discountValue` | Number | required |
| `maxUses` | Number | default: 1 |
| `usedCount` | Number | default: 0 |
| `isActive` | Boolean | default: true |
| `expiryDate` | Date | required |
| `alias` | String | optional description |

### 5. `Message` (`src/models/Message.js`)
| Field | Type | Constraints / Default |
|---|---|---|
| `order` | ObjectId (Order)| required |
| `senderId` | ObjectId | required |
| `senderModel` | String | enum: `['User', 'Rider']`, required |
| `text` | String | required |
*Purpose:* Stores chat history between users and riders per order.

### 6. `Notification` (`src/models/Notification.js`)
| Field | Type | Constraints / Default |
|---|---|---|
| `recipientId` | ObjectId | required |
| `recipientType` | String | enum: `['user', 'rider']` |
| `title` | String | required |
| `body` | String | required |
| `isRead` | Boolean | default: false |
*Purpose:* Persistent inbox messages from Admins.

---

## Controllers & Routes

### `authController` (`/api/auth`)
- `POST /register`, `POST /login`, `POST /rider/register`, `POST /rider/login`.
- `GET /profile` — returns authenticated profile.
- `PATCH /fcm-token` — updates push notification token.
- `PATCH /profile-pic` & `PATCH /rider/nid` — handle base64 image updates.

### `orderController` (`/api/orders`)
- `POST /` — creates orders, calculates price (checking `clientOrderId` for deduplication), accepts `couponCode`.
- `POST /price` — calculates fare dynamically.
- `GET /`, `GET /:id`, `PATCH /:id/cancel`.

### `riderController` (`/api/riders`)
- `GET /pending` — gets unassigned orders.
- `PATCH /:id/accept` — assign rider to order.
- `PATCH /:id/status` — enforces status flow (`accepted` → `picked_up` → `in_transit` → `delivered`). Credit rider 80% on delivery.
- `PATCH /availability` — toggle `isAvailable` status.

### `adminController` (`/api/admin`)
- `GET /dashboard` — aggregates total orders, revenue, active deliveries, and counts.
- `GET /orders`, `GET /users`, `GET /riders`.
- `PATCH /users/:id/block`, `PATCH /riders/:id/block` — toggles `isBlocked`.
- `PATCH /orders/:id/status` — overrides any order status.

### `couponController` (`/api/coupons`)
- CRUD operations for Coupons. Admin restricted routes.
- `POST /validate` — public route to check coupon validity and return discount parameters.

### `chatController` (`/api/chat`)
- `GET /:orderId` — loads chat history for a specific order. 

### `notificationController` (`/api/notifications`)
- `POST /send` — (Admin) broadcasts Firebase Push Notifications to specified `targetType` ('users', 'riders', 'all', 'specific') and saves them into the `Notification` collection.
- `GET /my` — gets the logged-in user's inbox.
- `PATCH /read/:id` and `PATCH /read/all` — marks notifications as read.

---

## Middleware
### `auth.js` (`protect`)
- Extracts JWT from `Bearer` header. 
- Verifies token and populates `req.user` by querying the User or Rider model.
- Checks `req.user.isBlocked`. Returns `403` if blocked.

### `roleGuard.js`
- Checks if `req.user.role === expectedRole` (or if it's a rider). Returns `403` if unauthorized.

---

## Real-Time Engine (Socket.io)
- The server mounts `socket.io` and handles `"join_order_room"` to place clients into specific order rooms.
- On `"send_message"`, the server immediately emits `"receive_message"` to the room and then async writes the message to the MongoDB `Message` collection.

---

## Coding Guidelines
1. No code comments.
2. CommonJS (`require`/`module.exports`).
3. Clean, modern syntax.
4. All async functions use `async/await` with `try/catch`.
5. Maintain strict Error Response format: `{"message": "description"}`.
