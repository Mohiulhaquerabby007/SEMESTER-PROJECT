# QuickDrop — Frontend Master Prompt

## Role
You are an Expert Frontend Engineer specializing in React 18, Vite, TanStack Query, React Router v6, Socket.io Client, and Firebase Web SDK. You write clean, modern, component-based code using inline styles and a glass-morphism design system (no TailwindCSS utility classes in component logic — Tailwind is only used in App.jsx shell layout). All code is in JSX with no TypeScript.

---

## Project Context
QuickDrop is a parcel delivery PWA with three user roles — **Customer (user)**, **Rider**, and **Admin**. The frontend is offline-first (Service Worker + Dexie.js for queued orders), features real-time chat via Socket.io, push notifications via Firebase Cloud Messaging, and a persistent notification inbox.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Data Fetching | TanStack Query v5 (`@tanstack/react-query`) |
| HTTP | Axios (`src/services/api.js`) |
| Real-time | Socket.io Client |
| Push Notifications | Firebase Web SDK v9+ |
| Offline Storage | Dexie.js (IndexedDB) |
| Toasts | react-hot-toast |
| Icons | Google Material Symbols (CDN) |
| Fonts | Plus Jakarta Sans (Google Fonts) |

---

## Folder Structure
```text
frontend/src/
├── App.jsx                    — Shell layout + all Routes
├── main.jsx                   — React entry point, QueryClientProvider
├── index.css                  — Global design system (tokens, glass panels, animations)
├── components/
│   ├── Sidebar.jsx            — Desktop sidebar nav with notification bell
│   ├── BottomNav.jsx          — Mobile bottom tab bar with notification badge
│   ├── NotificationInbox.jsx  — Collapsible inbox panel (user/rider)
│   ├── ChatBox.jsx            — Real-time chat widget per order
│   ├── DeliveryMap.jsx        — Map/distance input component
│   ├── NetworkBadge.jsx       — Offline/online status indicator
│   ├── ProtectedRoute.jsx     — Auth + role guard wrapper
│   └── StatusBadge.jsx        — Order status chip component
├── context/
│   └── AuthContext.jsx        — Global auth state (user, login, logout, updateUser)
├── hooks/
│   └── usePushNotifications.js — Firebase FCM token registration + foreground toast
├── pages/
│   ├── auth/
│   │   ├── Login.jsx          — Email/password + Google Sign-In login
│   │   └── Register.jsx       — Customer + Rider registration with NID upload
│   ├── user/
│   │   ├── Dashboard.jsx      — Order stats, recent orders, quick actions
│   │   ├── BookParcel.jsx     — Order creation form with coupon validation
│   │   ├── OrderHistory.jsx   — Filterable order list
│   │   ├── OrderDetails.jsx   — Single order view + ChatBox
│   │   └── Profile.jsx        — Profile card + NotificationInbox
│   ├── rider/
│   │   ├── Dashboard.jsx      — Earnings summary, availability toggle
│   │   ├── PendingOrders.jsx  — Accept available jobs
│   │   ├── MyDeliveries.jsx   — Active + past deliveries with status controls
│   │   ├── Earnings.jsx       — Earnings history + totals
│   │   └── Profile.jsx        — Rider profile card + NotificationInbox
│   └── admin/
│       ├── Dashboard.jsx      — KPI cards + charts (revenue/order trend)
│       ├── Orders.jsx         — All orders table, filterable/searchable
│       ├── ManageUsers.jsx    — Block/unblock users, view order counts
│       ├── ManageRiders.jsx   — Block/unblock riders, view NID images
│       ├── ManageCoupons.jsx  — CRUD for discount coupons
│       └── SendNotifications.jsx — Admin notification broadcast UI
└── services/
    └── api.js                 — Axios instance with JWT interceptors
```

---

## Design System (index.css)

### Color Tokens (via `@theme`)
| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#532aa8` | Primary dark |
| `--color-primary-container` | `#6b46c1` | Primary purple (buttons, accents) |
| `--color-soft-lavender` | `#e9d8fd` | Page background |
| `--color-on-surface` | `#181c1e` | Main text |
| `--color-outline` | `#7a7484` | Muted text, icons |

### Key CSS Classes
| Class | Description |
|---|---|
| `.glass-panel` | Frosted-glass card (white 60% bg + backdrop-filter) |
| `.glass-sidebar` | Sidebar glass surface |
| `.glass-header` | Mobile header glass surface |
| `.glass-nav` | Bottom nav glass surface |
| `.btn-primary` | Purple gradient CTA button |
| `.page-container` | Padded page wrapper with max-width |
| `.animate-fade-in` | Entrance animation |
| `.animate-spin` | Loading spinner |

### Keyframe Animations
- `@keyframes pulse` — badge pulse (scale 1 → 1.2 → 1)
- `@keyframes spin` — defined inline in App.jsx loading screen

---

## Auth System (`src/context/AuthContext.jsx`)

- Stores JWT in `localStorage` as key `quickdrop_token`.
- On mount, fetches `GET /api/auth/profile` to restore session.
- Exposes: `user`, `loading`, `login(data)`, `logout()`, `updateUser(patch)`.
- `user` shape: `{ _id, name, email, phone, role, accountType, profilePic, isAvailable?, fcmToken? }`
  - `accountType` = `'user'`, `'rider'`, or `'admin'`

---

## API Service (`src/services/api.js`)
- Axios instance with `baseURL: http://localhost:5005/api`
- Request interceptor: attach `Authorization: Bearer <token>` from localStorage
- Response interceptor: on `401`, clear token and redirect to `/login`

---

## Routing (App.jsx)

| Path | Component | Guard |
|---|---|---|
| `/login` | `Login` | Public |
| `/register` | `Register` | Public |
| `/user/dashboard` | `UserDashboard` | `allowedTypes: ['user']` |
| `/user/book` | `BookParcel` | `allowedTypes: ['user']` |
| `/user/orders` | `OrderHistory` | `allowedTypes: ['user']` |
| `/user/orders/:id` | `OrderDetails` | `allowedTypes: ['user']` |
| `/user/profile` | `Profile` | `allowedTypes: ['user']` |
| `/rider/dashboard` | `RiderDashboard` | `allowedTypes: ['rider']` |
| `/rider/pending` | `PendingOrders` | `allowedTypes: ['rider']` |
| `/rider/deliveries` | `MyDeliveries` | `allowedTypes: ['rider']` |
| `/rider/earnings` | `Earnings` | `allowedTypes: ['rider']` |
| `/rider/profile` | `RiderProfile` | `allowedTypes: ['rider']` |
| `/admin/dashboard` | `AdminDashboard` | `allowedTypes: ['admin']` |
| `/admin/orders` | `AdminOrders` | `allowedTypes: ['admin']` |
| `/admin/users` | `ManageUsers` | `allowedTypes: ['admin']` |
| `/admin/riders` | `ManageRiders` | `allowedTypes: ['admin']` |
| `/admin/coupons` | `ManageCoupons` | `allowedTypes: ['admin']` |
| `/admin/notifications` | `SendNotifications` | `allowedTypes: ['admin']` |

---

## Key Component Specs

### `NotificationInbox.jsx`
- Imports from `../services/api` (ONE level up — component is in `src/components/`)
- Uses `useQuery` with key `["myNotifications"]`
- Polls `GET /api/notifications/my` every 30 seconds
- `PATCH /api/notifications/read/:id` — marks one read
- `PATCH /api/notifications/read/all` — marks all read
- Shows unread count badge, collapsible panel, relative timestamps

### `Sidebar.jsx`
- Notification bell in footer — polls `["myNotifications"]` every 30s
- Hidden for `admin` role (`enabled: user.accountType !== 'admin'`)
- Bell shows `notifications_active` icon + animated red badge when `unreadCount > 0`
- Navigates to `/user/profile` or `/rider/profile` on click

### `BottomNav.jsx`
- Red badge on Profile tab icon when `unreadCount > 0`
- Same 30s polling, disabled for admin

### `usePushNotifications.js`
- Registers Firebase messaging token on `user` login
- Calls `POST /api/auth/update-fcm-token` with the token
- Foreground messages displayed as `react-hot-toast` (NOT native Notification API)

### `ChatBox.jsx`
- Connects to Socket.io at `http://localhost:5005`
- Joins room: `socket.emit('join_order_room', orderId)`
- Sends: `socket.emit('send_message', { orderId, senderId, senderModel, text })`
- Receives: `socket.on('receive_message', (msg) => ...)`
- Also loads history: `GET /api/chat/:orderId`

---

## Pricing Formula (matches backend exactly)
```
Price = 60 + (distance × 15) + parcelTypeCharge + extraWeightCharge
parcelTypeCharge: document=0, small=10, medium=25, large=50
extraWeightCharge: (weight > 5) ? (weight - 5) × 5 : 0
```
Implemented in `BookParcel.jsx` for live preview before submission.

---

## Coding Guidelines
1. No TypeScript — plain `.jsx` files only.
2. All components use `inline styles` for component-specific styling.
3. Global/layout classes only use CSS class names from `index.css`.
4. All data fetching uses TanStack Query (`useQuery` / `useMutation`).
5. All API calls go through `src/services/api.js` (never raw `fetch`).
6. Toast feedback on all mutations: `toast.success()` / `toast.error()`.
7. Image uploads are base64 encoded via `FileReader` + `canvas` (resized to max 200×200 for avatars, full-res for NID).
8. Import path rule for `NotificationInbox`: always `../services/api` (one level up from `src/components/`).
