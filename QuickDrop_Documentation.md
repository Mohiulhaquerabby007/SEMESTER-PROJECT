# QuickDrop — Full Project Documentation & Development Journey

> **Project:** Parcel Delivery Platform | **Stack:** React + Vite + Node.js + MongoDB + Capacitor  
> **Roles:** User · Rider · Admin | **Feature:** Offline-First with IndexedDB sync

---

## Table of Contents
1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Repository Structure](#2-repository-structure)
3. [Phase 0: Prerequisites & Initial Setup](#3-phase-0-prerequisites--initial-setup)
4. [Phase 1: Backend — Database & API](#4-phase-1-backend--database--api)
5. [Phase 2: Frontend Foundation](#5-phase-2-frontend-foundation)
6. [Phase 3: Offline-First Engine](#6-phase-3-offline-first-engine)
7. [Phase 4: User Panel](#7-phase-4-user-panel)
8. [Phase 5: Rider Panel](#8-phase-5-rider-panel)
9. [Phase 6: Admin Panel](#9-phase-6-admin-panel)
10. [Phase 7: Mobile App (Capacitor)](#10-phase-7-mobile-app-capacitor)
11. [API Reference](#11-api-reference)
12. [Pricing Logic](#12-pricing-logic)
13. [Environment Variables](#13-environment-variables)
14. [How to Run Locally](#14-how-to-run-locally)
15. [Known Issues & Fixes](#15-known-issues--fixes)

---

## 1. Project Overview & Architecture

**QuickDrop** is a full-stack parcel delivery platform with three distinct user roles (Customer, Rider, Admin) and a core **offline-first** architecture so bookings work even without internet.

### Technology Choices & Rationale

| Technology | Why Chosen |
|---|---|
| **React 19 + Vite 8** | Fast HMR, modular components, modern JSX transform |
| **Tailwind CSS v4** | Utility-first with custom design tokens; no runtime overhead |
| **Dexie.js (IndexedDB)** | Local database for storing orders while offline |
| **TanStack Query v5** | Server-state caching, background refetching, loading states |
| **Axios** | HTTP client with interceptor support for auto JWT injection |
| **Node.js + Express** | Non-blocking I/O, perfect for concurrent delivery requests |
| **Mongoose + MongoDB** | Flexible schema, great for nested delivery data |
| **bcryptjs** | Secure password hashing (cost factor 12) |
| **jsonwebtoken** | Stateless JWT auth; no session storage needed on server |
| **mongodb-memory-server** | In-memory MongoDB fallback for dev when Atlas is unreachable |
| **@capacitor/core + android** | Wraps the React PWA into a native Android APK |
| **@capacitor/network** | Native network status — more reliable than `navigator.onLine` on mobile |

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│              React Frontend              │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ User Panel│ │Rider Panel│ │Admin Pan│ │
│  └──────────┘ └──────────┘ └─────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │  TanStack Query (server state)      │ │
│  │  Dexie.js / IndexedDB (local state) │ │
│  │  Axios + JWT Interceptor            │ │
│  └─────────────────────────────────────┘ │
└──────────────────┬──────────────────────┘
                   │ HTTP /api/*
┌──────────────────▼──────────────────────┐
│          Express.js API Server           │
│  protect middleware → roleGuard          │
│  /auth  /orders  /riders  /admin         │
└──────────────────┬──────────────────────┘
                   │ Mongoose ODM
┌──────────────────▼──────────────────────┐
│    MongoDB Atlas (or in-memory fallback) │
│    Collections: users · riders · orders  │
└─────────────────────────────────────────┘
```

---

## 2. Repository Structure

```
SEMESTER-PROJECT/
├── backend/
│   ├── .env
│   ├── package.json
│   └── src/
│       ├── server.js              # Express entry point
│       ├── config/
│       │   └── db.js              # MongoDB connect + memory fallback
│       ├── models/
│       │   ├── User.js
│       │   ├── Rider.js
│       │   └── Order.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── orderController.js
│       │   ├── riderController.js
│       │   └── adminController.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── orders.js
│       │   ├── riders.js
│       │   └── admin.js
│       ├── middleware/
│       │   ├── auth.js            # JWT protect middleware
│       │   └── roleGuard.js       # Role-based access control
│       └── utils/
│           └── pricing.js         # Fare calculation
└── frontend/
    ├── index.html
    ├── vite.config.js             # Vite + Tailwind + proxy to :5000
    ├── capacitor.config.json
    ├── package.json
    └── src/
        ├── main.jsx               # App entry + QueryClient + Router
        ├── App.jsx                # Route definitions + role-based redirect
        ├── index.css              # Design tokens + global styles
        ├── context/
        │   └── AuthContext.jsx    # Login/register/logout + localStorage
        ├── services/
        │   ├── api.js             # Axios instance + JWT interceptor
        │   ├── dexieDb.js         # IndexedDB schema (QuickDropDB)
        │   └── syncService.js     # Offline save + background sync
        ├── components/
        │   ├── BottomNav.jsx      # Role-aware navigation bar
        │   ├── NetworkBadge.jsx   # Online/offline indicator
        │   ├── ProtectedRoute.jsx # Auth + role guard for routes
        │   └── StatusBadge.jsx    # Coloured order status pill
        └── pages/
            ├── auth/
            │   ├── Login.jsx
            │   └── Register.jsx
            ├── user/
            │   ├── Dashboard.jsx
            │   ├── BookParcel.jsx      # 3-step booking form
            │   ├── OrderHistory.jsx
            │   ├── OrderDetails.jsx
            │   └── Profile.jsx
            ├── rider/
            │   ├── Dashboard.jsx
            │   ├── PendingOrders.jsx
            │   ├── MyDeliveries.jsx
            │   └── Earnings.jsx
            └── admin/
                ├── Dashboard.jsx
                ├── Orders.jsx
                ├── ManageUsers.jsx
                └── ManageRiders.jsx
```

---

## 3. Phase 0: Prerequisites & Initial Setup

### Tools Required
- Node.js ≥ 18, npm ≥ 9
- Android Studio (for APK build)
- MongoDB Atlas account (or leave default — memory fallback activates)

### Create workspace
```bash
mkdir SEMESTER-PROJECT
cd SEMESTER-PROJECT
git init
```

### .gitignore (root)
```
node_modules/
dist/
.env
```

---

## 4. Phase 1: Backend — Database & API

### Step 1 — Initialize Backend
```bash
mkdir backend && cd backend
npm init -y
npm install express mongoose dotenv cors bcryptjs jsonwebtoken mongodb-memory-server
npm install --save-dev nodemon
```

**`backend/package.json` scripts:**
```json
{
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "type": "commonjs"
}
```

### Step 2 — Environment Variables (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?appName=Cluster
JWT_SECRET=<your-256-bit-secret>
JWT_EXPIRES_IN=7d
```

### Step 3 — Database Connection with Fallback (`src/config/db.js`)

**Why:** Atlas can be unreachable in dev. We fall back to `mongodb-memory-server` so the app never crashes during development.

```js
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;
    // Detect unfilled placeholders
    if (uri.includes("<username>") || uri.includes("xxxxx")) {
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    }
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`);
    console.log("Starting in-memory fallback...");
    try {
      const mongoServer = await MongoMemoryServer.create();
      const conn = await mongoose.connect(mongoServer.getUri());
      console.log(`Fallback MongoDB Connected: ${conn.connection.host}`);
    } catch (fallbackError) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
```

### Step 4 — Mongoose Models

#### `src/models/User.js`
Fields: `name`, `email`(unique), `phone`(unique), `password`(bcrypt, hidden by default), `role`(user|admin), `isBlocked`, `address`.  
Pre-save hook hashes password at cost factor 12. Has `comparePassword()` instance method.

#### `src/models/Rider.js`
Fields: `name`, `email`, `phone`, `password`, `vehicleType`(bike|car|van), `isAvailable`, `isBlocked`, `totalEarnings`, `completedDeliveries`.  
Same bcrypt pre-save + comparePassword pattern as User.

#### `src/models/Order.js`
Fields: `user`(ref), `rider`(ref, nullable), `pickupAddress`, `pickupPhone`, `dropoffAddress`, `dropoffPhone`, `parcelType`(document|small|medium|large), `weight`, `distance`, `price`, `status`(pending→accepted→picked_up→in_transit→delivered|cancelled), `clientOrderId`(key for dedup), `notes`.  
**Indexes:** `{user,status}`, `{rider,status}`, `{status}` for query performance.

> **`clientOrderId` is the offline-sync dedup key.** When a locally saved order is synced, this ID lets the backend detect and skip duplicates.

### Step 5 — Middleware

#### `src/middleware/auth.js` — JWT Protect
Reads `Authorization: Bearer <token>` header. Verifies JWT. Looks up User first, then Rider if not found. Sets `req.user` and `req.accountType`. Rejects blocked accounts with 403.

#### `src/middleware/roleGuard.js` — Role-Based Access
```js
const roleGuard = (...allowedTypes) => (req, res, next) => {
  if (!allowedTypes.includes(req.accountType) && !allowedTypes.includes(req.user.role))
    return res.status(403).json({ message: "Access denied" });
  next();
};
```

### Step 6 — Controllers

#### `authController.js`
- `registerUser` — checks duplicate email/phone, creates User, returns JWT
- `loginUser` — verifies password, checks isBlocked, returns JWT
- `registerRider` / `loginRider` — same pattern for Rider model
- `getProfile` — returns req.user data (protected)

#### `orderController.js`
- `createOrder` — checks clientOrderId dedup, calls `calculatePrice()`, creates Order
- `getUserOrders` — finds by `user: req.user._id`, populates rider info
- `getOrderById` — populates both user and rider
- `cancelOrder` — only works on `status: "pending"`, owned by req.user
- `getPrice` — utility endpoint to preview fare before booking

#### `riderController.js`
- `getPendingOrders` — finds `status: "pending"` for claim list
- `acceptOrder` — assigns rider, changes status to accepted, sets rider `isAvailable=false`
- `updateOrderStatus` — enforces valid transitions: accepted→picked_up→in_transit→delivered
- On delivered: credits rider 80% of order price, increments `completedDeliveries`, sets `isAvailable=true`
- `getMyDeliveries` — orders where `rider: req.user._id`
- `getEarnings` — returns totalEarnings + completedDeliveries from Rider doc

#### `adminController.js`
- `getDashboard` — parallel `Promise.all` for: totalOrders, activeDeliveries, totalUsers, totalRiders, totalRevenue
- `getAllOrders` — paginated, filterable by status
- `getAllUsers` / `getAllRiders` — full lists
- `toggleBlockUser` / `toggleBlockRider` — flips isBlocked boolean
- `overrideOrderStatus` — admin can force any status

### Step 7 — Routes & Server

All routes follow the pattern: `protect` (JWT) → `roleGuard(role)` → controller.  
Admin routes apply `protect + roleGuard("admin")` via `router.use()` so every admin endpoint is secured in one line.

**`src/server.js`** mounts:
- `GET /api/health` — uptime check
- `/api/auth` — auth routes
- `/api/orders` — order routes (user role)
- `/api/riders` — rider routes (rider role)
- `/api/admin` — admin routes (admin role)
- Global error handler middleware

---

## 5. Phase 2: Frontend Foundation

### Step 1 — Scaffold with Vite
```bash
cd SEMESTER-PROJECT
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

### Step 2 — Install Dependencies
```bash
npm install react-router-dom axios dexie dexie-react-hooks @tanstack/react-query react-hot-toast react-icons
npm install @capacitor/core @capacitor/cli @capacitor/network
npm install @capacitor/android
npm install --save-dev @tailwindcss/vite tailwindcss
```

### Step 3 — Vite Config (`vite.config.js`)

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
    },
  },
});
```

**Why proxy:** During dev, Vite serves on `:3000` and the API is on `:5000`. The proxy forwards any `/api/*` request to Express, avoiding CORS issues.

### Step 4 — Design System (`src/index.css`)

Uses Tailwind v4 `@theme` to define custom CSS variables:

| Token | Value | Use |
|---|---|---|
| `--color-primary-500` | `#6C3CE1` | Brand purple — buttons, active states |
| `--color-dark-950` | `#020617` | Page background |
| `--color-dark-800` | `#1e293b` | Card backgrounds |
| `.glass` | `rgba(30,41,59,0.6)` + blur | Glassmorphism cards |

Custom animations defined: `fade-in`, `slide-up`, `pulse-glow`.  
Global `input/select/textarea` styles give consistent dark field appearance with purple focus rings.

### Step 5 — App Entry (`src/main.jsx`)

Wraps the app in:
1. `BrowserRouter` (routing)
2. `AuthProvider` (user state)
3. `QueryClientProvider` (server state)
4. `Toaster` (toast notifications)

### Step 6 — Auth Context (`src/context/AuthContext.jsx`)

- Reads persisted user from `localStorage("quickdrop_auth")` on mount
- `login(email, password, isRider)` → hits `/auth/login` or `/auth/rider/login` → stores full user object + JWT
- `register(payload, isRider)` → hits register endpoint → stores same
- `logout()` → clears localStorage, redirects to `/login`
- `accountType` is set to `"user"`, `"rider"`, or `"admin"` based on role

### Step 7 — Axios API Service (`src/services/api.js`)

```js
const api = axios.create({ baseURL: "/api" });

// Request interceptor: auto-attach JWT
api.interceptors.request.use((config) => {
  const auth = localStorage.getItem("quickdrop_auth");
  if (auth) config.headers.Authorization = `Bearer ${JSON.parse(auth).token}`;
  return config;
});

// Response interceptor: auto-logout on 401
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem("quickdrop_auth");
    window.location.href = "/login";
  }
  return Promise.reject(err);
});
```

### Step 8 — App Router (`src/App.jsx`)

- Root `/` redirects to the correct dashboard based on `user.accountType`
- Each panel route is wrapped in `<ProtectedRoute allowedTypes={[...]}>` which checks auth + role
- `<NetworkBadge />` renders globally at top level
- `<BottomNav />` renders globally — it reads `user.accountType` and shows role-specific nav items

---

## 6. Phase 3: Offline-First Engine

### Dexie IndexedDB Schema (`src/services/dexieDb.js`)

```js
const db = new Dexie("QuickDropDB");
db.version(1).stores({
  orders: "++id, clientOrderId, sync_status, status, createdAt",
  pendingActions: "++id, type, payload, createdAt",
});
```

Dexie wraps the browser's built-in IndexedDB with a promise-based API. Orders saved here persist across page reloads and device restarts.

### Sync Service (`src/services/syncService.js`)

**Three exported functions:**

1. **`saveOrderLocally(orderData)`**  
   Generates a unique `clientOrderId` (`local_<timestamp>_<random>`), saves order with `sync_status: "pending"` to Dexie.

2. **`syncPendingOrders()`**  
   Queries all orders where `sync_status == "pending"`. For each, POSTs to `/api/orders`. On success, updates the local record to `sync_status: "synced"` and saves the server's `_id` and `price`.

3. **`initNetwork()`** (auto-runs on import)  
   Uses `@capacitor/network` to get current status. If online, immediately syncs. Adds a listener that triggers sync whenever connectivity is restored.

**Why `@capacitor/network` over `navigator.onLine`:**  
On Android, `navigator.onLine` returns `true` even when connected to a WiFi router with no internet. Capacitor hooks into the Android OS network callbacks for 100% accurate status.

---

## 7. Phase 4: User Panel

### Pages

| Page | Route | Description |
|---|---|---|
| `Dashboard.jsx` | `/user/dashboard` | Welcome card, quick stats, recent orders |
| `BookParcel.jsx` | `/user/book` | 3-step booking form |
| `OrderHistory.jsx` | `/user/orders` | TanStack Query list of all orders |
| `OrderDetails.jsx` | `/user/orders/:id` | Full order info + cancel button |
| `Profile.jsx` | `/user/profile` | User info display + logout |

### BookParcel — 3-Step Form Logic

**Step 1 — Addresses:** pickup address, pickup phone, dropoff address, dropoff phone  
**Step 2 — Parcel Details:** parcel type (document/small/medium/large), weight (kg), distance (km), notes  
**Step 3 — Review & Confirm:** calls `/api/orders/price` to show estimated fare. On confirm:
- If **online** → POST to `/api/orders` directly
- If **offline** → `saveOrderLocally()` → shows success immediately, syncs in background

This gives users an instant booking experience regardless of network state.

---

## 8. Phase 5: Rider Panel

| Page | Route | Description |
|---|---|---|
| `Dashboard.jsx` | `/rider/dashboard` | Stats card, quick action links |
| `PendingOrders.jsx` | `/rider/pending` | List of unassigned orders; "Accept" button |
| `MyDeliveries.jsx` | `/rider/deliveries` | Accepted orders with status update buttons |
| `Earnings.jsx` | `/rider/earnings` | totalEarnings + completedDeliveries |

### Status Transition Buttons

The `updateOrderStatus` controller enforces this state machine server-side:

```
pending ──[accept]──► accepted ──► picked_up ──► in_transit ──► delivered
```

When delivered, the rider earns **80% of the order price** (platform keeps 20%). `completedDeliveries` increments and `isAvailable` resets to `true`.

---

## 9. Phase 6: Admin Panel

| Page | Route | Description |
|---|---|---|
| `Dashboard.jsx` | `/admin/dashboard` | KPI cards: total orders, revenue, active deliveries, user/rider counts |
| `Orders.jsx` | `/admin/orders` | Paginated order list, filter by status, override status |
| `ManageUsers.jsx` | `/admin/users` | List all users, block/unblock toggle |
| `ManageRiders.jsx` | `/admin/riders` | List all riders, block/unblock toggle |

All admin API routes are protected by `router.use(protect, roleGuard("admin"))` — a single line that secures every admin endpoint.

---

## 10. Phase 7: Mobile App (Capacitor)

### Step 1 — Initialize Capacitor
```bash
cd frontend
npx cap init QuickDrop com.quickdrop.app --web-dir dist
```

### Step 2 — Build Web Assets
```bash
npm run build
```

### Step 3 — Add Android Platform
```bash
npx cap add android
npx cap copy
```

### Step 4 — Open in Android Studio
```bash
npx cap open android
```
Then use Android Studio to build the APK or run on an emulator/device.

### `capacitor.config.json`
```json
{
  "appId": "com.quickdrop.app",
  "appName": "QuickDrop",
  "webDir": "dist"
}
```

### Native Network Detection

In `syncService.js`, replaced standard browser API with:
```js
import { Network } from '@capacitor/network';
const status = await Network.getStatus();  // { connected: true, connectionType: "wifi" }
Network.addListener('networkStatusChange', status => { ... });
```

This fires reliably on Android when switching between WiFi, mobile data, and airplane mode.

---

## 11. API Reference

### Auth Routes (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | None | Register new user |
| POST | `/login` | None | Login user, returns JWT |
| POST | `/rider/register` | None | Register new rider |
| POST | `/rider/login` | None | Login rider, returns JWT |
| GET | `/profile` | JWT | Get current user/rider profile |

### Order Routes (`/api/orders`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | User | Create order (dedup via clientOrderId) |
| GET | `/` | User | Get own order history |
| POST | `/price` | JWT | Calculate fare estimate |
| GET | `/:id` | JWT | Get single order details |
| PATCH | `/:id/cancel` | User | Cancel pending order |

### Rider Routes (`/api/riders`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/pending` | Rider | List all pending orders |
| GET | `/deliveries` | Rider | List own accepted/active orders |
| PATCH | `/:id/accept` | Rider | Accept a pending order |
| PATCH | `/:id/status` | Rider | Update delivery status |
| GET | `/earnings` | Rider | Get earnings summary |

### Admin Routes (`/api/admin`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/dashboard` | Admin | KPI summary |
| GET | `/orders` | Admin | Paginated orders (filter by status) |
| GET | `/users` | Admin | All users |
| GET | `/riders` | Admin | All riders |
| PATCH | `/users/:id/block` | Admin | Toggle user block |
| PATCH | `/riders/:id/block` | Admin | Toggle rider block |
| PATCH | `/orders/:id/status` | Admin | Override any order status |

---

## 12. Pricing Logic

**File:** `backend/src/utils/pricing.js`

```
Price = Base Fare + (Distance × Per-KM Rate) + Parcel Type Charge + Extra Weight Charge
```

| Component | Value |
|---|---|
| Base fare | ৳60 |
| Per KM | ৳15 |
| Document | +৳0 |
| Small parcel | +৳10 |
| Medium parcel | +৳25 |
| Large parcel | +৳50 |
| Extra weight (>5kg) | +৳5 per kg |

**Example:** 10km, 3kg Small → `60 + (10×15) + 10 + 0 = ৳220`

---

## 13. Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?appName=<App>
JWT_SECRET=<256-bit-hex-secret>
JWT_EXPIRES_IN=7d
```

> If `MONGO_URI` contains a placeholder like `<username>` or fails to connect, the app automatically spins up `mongodb-memory-server` as a fallback. Data will be lost on server restart in this mode.

---

## 14. How to Run Locally

### Terminal 1 — Backend
```bash
cd backend
npm run dev
# → QuickDrop API running on port 5000
# → MongoDB Connected: ... (or fallback in-memory)
```

### Terminal 2 — Frontend
```bash
cd frontend
npm run dev
# → Local: http://localhost:3000/
```

### Default Test Accounts
Create accounts via the Register page. To make an admin, manually update the `role` field in MongoDB:
```js
// In mongosh or MongoDB Compass
db.users.updateOne({ email: "admin@test.com" }, { $set: { role: "admin" } })
```

---

## 15. Known Issues & Fixes

### Fix 1 — MongoDB Atlas Connection Fails in Dev
**Problem:** Network restrictions or wrong URI prevents Atlas connection.  
**Fix Implemented:** `connectDB()` in `config/db.js` catches the error and spins up `mongodb-memory-server`. The server still boots and all API routes work — data just resets on restart.

### Fix 2 — navigator.onLine Unreliable on Android
**Problem:** `navigator.onLine` stays `true` even when connected to a captive portal or a WiFi router with no internet.  
**Fix Implemented:** Replaced with `@capacitor/network` which hooks into Android OS APIs for accurate connectivity events.

### Fix 3 — Duplicate Orders on Offline Sync
**Problem:** If the user books while offline, goes online, and the sync retries — the order could be created twice.  
**Fix Implemented:** Every offline order gets a `clientOrderId`. The `createOrder` controller checks `Order.findOne({ clientOrderId, user })` first. If found, returns the existing order instead of creating a new one.

### Fix 4 — JWT Expiry Breaks UI Silently
**Problem:** Expired tokens cause all API calls to fail with 401 but the UI showed no feedback.  
**Fix Implemented:** The Axios response interceptor catches any 401, clears `localStorage`, and redirects to `/login` immediately.

---

*Last updated: May 2026 — Documented by AI pair-programming assistant during active development.*
