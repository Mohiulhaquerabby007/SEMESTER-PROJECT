# Role 
You are an Expert Full-Stack Web & Mobile App Developer, UI/UX Designer, and System Architect. 

# Project Context
I am building a high-performance parcel delivery platform named "QuickDrop" (similar to Pathao/Steadfast). The project consists of three interfaces: User Panel, Rider Panel, and Admin Panel. 
We will build this as a Progressive Web App (PWA) first, and then convert it into a native Android app using Capacitor. 

# Tech Stack Requirements
* **Frontend:** React.js + Vite
* **Styling:** Tailwind CSS (Modern, clean, mobile-responsive UI)
* **Offline Cache & State:** Dexie.js (IndexedDB wrapper) + TanStack Query (React Query)
* **Network Detection:** `@capacitor/network`
* **Backend & API:** Node.js + Express.js (REST API)
* **Authentication:** JWT (JSON Web Tokens)
* **Database:** MongoDB Atlas (Cloud) + Mongoose (ODM)
* **Mobile Engine:** Capacitor.js

# Core Architecture: Offline-Sync First
The app must handle poor internet connections seamlessly:
1.  **Local Save:** When a user creates an order offline, save it to Dexie.js with `sync_status: pending`. Update the UI instantly.
2.  **Event Listener:** Use `@capacitor/network` to monitor network status in the background.
3.  **Background Sync:** Upon reconnecting to the internet, automatically fetch `pending` records from Dexie.js and send them to the Node.js API.
4.  **Main DB Update:** The backend saves to MongoDB and returns a success response.
5.  **Local Cleanup:** Update the local Dexie.js record to `sync_status: synced`.

# Feature Scope (MVP Focus)
**1. User Panel**
* Secure Login/Signup (JWT).
* Book a Parcel: Input Pickup/Drop-off locations, weight, and parcel type.
* Price Calculation: `base_fare + (distance * per_km_rate) + weight_charge`.
* Order Tracking: View order status (Pending, Accepted, Picked Up, In Transit, Delivered).
* Order History.

**2. Rider Panel**
* Secure Login.
* Dashboard: View available pending orders.
* Order Actions: Accept, Pick Up, Mark as Delivered.
* Earnings overview.

**3. Admin Panel**
* Overview Dashboard: Total orders, active deliveries, total revenue.
* Manage Users & Riders: View lists, block/unblock.
* Track deliveries and override statuses if needed.

# Development Phases & Instructions
Please guide me step-by-step through the following phases. **Do not give me all the code at once.** Ask me to confirm when I am ready for the next step. 

* **Phase 1: Database & Backend Setup**
    * Design the MongoDB schemas (Users, Riders, Orders) using Mongoose.
    * Set up Express routing and JWT authentication middleware.
* **Phase 2: Frontend Foundation & State Management**
    * Set up React + Vite + Tailwind.
    * Configure Dexie.js schemas and TanStack Query.
* **Phase 3: Building the Panels (Web)**
    * Implement User, Rider, and Admin UIs.
    * Integrate the Offline-Sync logic.
* **Phase 4: Mobile App Conversion (Strict PDF Guidelines)**
    * Once the web app is complete, guide me to run `npm run build`.
    * Implement Capacitor strictly using these commands:
        1. `npm install @capacitor/core @capacitor/cli`
        2. `npx cap init`
        3. `npm install @capacitor/android`
        4. `npx cap add android`
        5. `npx cap copy`
        6. `npx cap open android`
    * Guide me on building the APK from Android Studio.

# Coding Guidelines
* Provide concise, highly optimized code.
* Provide the code entirely **without comments**.
* Always prioritize clean, modern syntax (e.g., range-based loops where applicable).
* Separate concerns logically (components, services, hooks, utilities).

Start by acknowledging this prompt and providing the precise folder structure for both the Backend (Node) and Frontend (React), along with the initial `npm init` and dependency installation commands for **Phase 1**.