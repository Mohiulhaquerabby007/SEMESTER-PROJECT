const http = require("http");

const BASE = "http://localhost:5005";
const results = [];
let adminToken = null;
let userToken = null;
let riderToken = null;
let testOrderId = null;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (token) options.headers["Authorization"] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", (e) => reject(e));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function log(name, pass, detail = "") {
  const icon = pass ? "✅" : "❌";
  results.push({ name, pass });
  console.log(`${icon} ${name}${detail ? " — " + detail : ""}`);
}

async function run() {
  console.log("═══════════════════════════════════════════════");
  console.log("  QuickDrop Backend API Test Suite");
  console.log("═══════════════════════════════════════════════\n");

  // 1. Health Check
  try {
    const r = await request("GET", "/api/health");
    log("GET /api/health", r.status === 200 && r.body.status === "ok", `status=${r.status}`);
  } catch (e) { log("GET /api/health", false, e.message); }

  // 2. User Login
  try {
    const r = await request("POST", "/api/auth/login", { email: "mohiul@test.com", password: "test1234" });
    log("hgfgydjg")
    userToken = r.body.token;
    log("POST /api/auth/login (user)", r.status === 200 && !!userToken, `got token: ${!!userToken}`);
  } catch (e) { log("POST /api/auth/login (user)", false, e.message); }

  // 3. Rider Login
  try {
    const r = await request("POST", "/api/auth/rider/login", { email: "rubel@rider.com", password: "test1234" });
    riderToken = r.body.token;
    log("POST /api/auth/rider/login", r.status === 200 && !!riderToken, `got token: ${!!riderToken}`);
  } catch (e) { log("POST /api/auth/rider/login", false, e.message); }

  // 4. Admin Login
  try {
    const r = await request("POST", "/api/auth/login", { email: "admin@quickdrop.com", password: "admin1234" });
    adminToken = r.body.token;
    log("POST /api/auth/login (admin)", r.status === 200 && !!adminToken, `got token: ${!!adminToken}`);
  } catch (e) { log("POST /api/auth/login (admin)", false, e.message); }

  // 5. Get Profile (user)
  try {
    const r = await request("GET", "/api/auth/profile", null, userToken);
    log("GET /api/auth/profile (user)", r.status === 200 && r.body.email === "mohiul@test.com", `email=${r.body.email}`);
  } catch (e) { log("GET /api/auth/profile (user)", false, e.message); }

  // 6. Get Profile (rider)
  try {
    const r = await request("GET", "/api/auth/profile", null, riderToken);
    log("GET /api/auth/profile (rider)", r.status === 200 && r.body.email === "rubel@rider.com", `email=${r.body.email}`);
  } catch (e) { log("GET /api/auth/profile (rider)", false, e.message); }

  // 7. Calculate Price
  try {
    const r = await request("POST", "/api/orders/price", { distance: 10, parcelType: "medium", weight: 3 }, userToken);
    log("POST /api/orders/price", r.status === 200 && typeof r.body.price === "number", `price=${r.body.price}`);
  } catch (e) { log("POST /api/orders/price", false, e.message); }

  // 8. Create Order
  try {
    const r = await request("POST", "/api/orders", {
      pickupAddress: "Mirpur-10, Dhaka",
      pickupPhone: "01700000001",
      dropoffAddress: "Gulshan-2, Dhaka",
      dropoffPhone: "01799999999",
      parcelType: "small",
      weight: 2,
      distance: 8,
      clientOrderId: `test_${Date.now()}`,
    }, userToken);
    testOrderId = r.body._id;
    log("POST /api/orders (create)", r.status === 201 && !!testOrderId, `orderId=${testOrderId}`);
  } catch (e) { log("POST /api/orders (create)", false, e.message); }

  // 9. Get My Orders
  try {
    const r = await request("GET", "/api/orders", null, userToken);
    log("GET /api/orders (my orders)", r.status === 200 && Array.isArray(r.body), `count=${r.body.length}`);
  } catch (e) { log("GET /api/orders (my orders)", false, e.message); }

  // 10. Get Order By ID
  if (testOrderId) {
    try {
      const r = await request("GET", `/api/orders/${testOrderId}`, null, userToken);
      log("GET /api/orders/:id", r.status === 200 && r.body._id === testOrderId, `status=${r.body.status}`);
    } catch (e) { log("GET /api/orders/:id", false, e.message); }
  }

  // 11. Rider: Get Pending Orders
  try {
    const r = await request("GET", "/api/riders/pending", null, riderToken);
    log("GET /api/riders/pending", r.status === 200 && Array.isArray(r.body), `count=${r.body.length}`);
  } catch (e) { log("GET /api/riders/pending", false, e.message); }

  // 12. Rider: Accept the test order
  if (testOrderId) {
    try {
      const r = await request("PATCH", `/api/riders/${testOrderId}/accept`, {}, riderToken);
      log("PATCH /api/riders/:id/accept", r.status === 200 && r.body.status === "accepted", `status=${r.body.status}`);
    } catch (e) { log("PATCH /api/riders/:id/accept", false, e.message); }
  }

  // 13. Rider: Update status → picked_up
  if (testOrderId) {
    try {
      const r = await request("PATCH", `/api/riders/${testOrderId}/status`, { status: "picked_up" }, riderToken);
      log("PATCH /api/riders/:id/status (picked_up)", r.status === 200 && r.body.status === "picked_up", `status=${r.body.status}`);
    } catch (e) { log("PATCH /api/riders/:id/status (picked_up)", false, e.message); }
  }

  // 14. Rider: Update status → in_transit
  if (testOrderId) {
    try {
      const r = await request("PATCH", `/api/riders/${testOrderId}/status`, { status: "in_transit" }, riderToken);
      log("PATCH /api/riders/:id/status (in_transit)", r.status === 200 && r.body.status === "in_transit", `status=${r.body.status}`);
    } catch (e) { log("PATCH /api/riders/:id/status (in_transit)", false, e.message); }
  }

  // 15. Rider: Update status → delivered
  if (testOrderId) {
    try {
      const r = await request("PATCH", `/api/riders/${testOrderId}/status`, { status: "delivered" }, riderToken);
      log("PATCH /api/riders/:id/status (delivered)", r.status === 200 && r.body.status === "delivered", `status=${r.body.status}`);
    } catch (e) { log("PATCH /api/riders/:id/status (delivered)", false, e.message); }
  }

  // 16. Rider: Get Earnings
  try {
    const r = await request("GET", "/api/riders/earnings", null, riderToken);
    log("GET /api/riders/earnings", r.status === 200 && typeof r.body.totalEarnings === "number", `earnings=${r.body.totalEarnings}`);
  } catch (e) { log("GET /api/riders/earnings", false, e.message); }

  // 17. Rider: Get Profile
  try {
    const r = await request("GET", "/api/riders/profile", null, riderToken);
    log("GET /api/riders/profile", r.status === 200 && r.body.email === "rubel@rider.com", `name=${r.body.name}`);
  } catch (e) { log("GET /api/riders/profile", false, e.message); }

  // 18. Rider: Get Deliveries
  try {
    const r = await request("GET", "/api/riders/deliveries", null, riderToken);
    log("GET /api/riders/deliveries", r.status === 200 && Array.isArray(r.body), `count=${r.body.length}`);
  } catch (e) { log("GET /api/riders/deliveries", false, e.message); }

  // 19. Admin: Dashboard
  try {
    const r = await request("GET", "/api/admin/dashboard", null, adminToken);
    log("GET /api/admin/dashboard", r.status === 200 && typeof r.body.totalOrders === "number", `orders=${r.body.totalOrders}, revenue=${r.body.totalRevenue}`);
  } catch (e) { log("GET /api/admin/dashboard", false, e.message); }

  // 20. Admin: Analytics
  try {
    const r = await request("GET", "/api/admin/analytics?days=14", null, adminToken);
    log("GET /api/admin/analytics", r.status === 200 && r.body.statusDist, `trends=${r.body.revenueTrend?.length} days`);
  } catch (e) { log("GET /api/admin/analytics", false, e.message); }

  // 21. Admin: Leaderboards
  try {
    const r = await request("GET", "/api/admin/leaderboards", null, adminToken);
    log("GET /api/admin/leaderboards", r.status === 200 && r.body.topRiders, `topRiders=${r.body.topRiders?.length}`);
  } catch (e) { log("GET /api/admin/leaderboards", false, e.message); }

  // 22. Admin: All Orders
  try {
    const r = await request("GET", "/api/admin/orders", null, adminToken);
    log("GET /api/admin/orders", r.status === 200 && Array.isArray(r.body.orders), `total=${r.body.total}, pages=${r.body.pages}`);
  } catch (e) { log("GET /api/admin/orders", false, e.message); }

  // 23. Admin: All Users
  try {
    const r = await request("GET", "/api/admin/users", null, adminToken);
    log("GET /api/admin/users", r.status === 200 && Array.isArray(r.body), `count=${r.body.length}`);
  } catch (e) { log("GET /api/admin/users", false, e.message); }

  // 24. Admin: All Riders
  try {
    const r = await request("GET", "/api/admin/riders", null, adminToken);
    log("GET /api/admin/riders", r.status === 200 && Array.isArray(r.body), `count=${r.body.length}`);
  } catch (e) { log("GET /api/admin/riders", false, e.message); }

  // 25. Validate Coupon
  try {
    const r = await request("POST", "/api/coupons/validate", { code: "WELCOME50" }, userToken);
    log("POST /api/coupons/validate", r.status === 200 && r.body.discountValue === 50, `discount=${r.body.discountValue}%`);
  } catch (e) { log("POST /api/coupons/validate", false, e.message); }

  // 26. Admin: Get All Coupons
  try {
    const r = await request("GET", "/api/coupons", null, adminToken);
    log("GET /api/coupons (admin)", r.status === 200 && Array.isArray(r.body), `count=${r.body.length}`);
  } catch (e) { log("GET /api/coupons (admin)", false, e.message); }

  // 27. Chat: Send Message
  if (testOrderId) {
    try {
      const r = await request("POST", `/api/chat/${testOrderId}`, { text: "Hello rider!" }, userToken);
      log("POST /api/chat/:orderId (send)", r.status === 201 && r.body.text === "Hello rider!", `msg=${r.body.text}`);
    } catch (e) { log("POST /api/chat/:orderId (send)", false, e.message); }
  }

  // 28. Chat: Get Messages
  if (testOrderId) {
    try {
      const r = await request("GET", `/api/chat/${testOrderId}`, null, userToken);
      log("GET /api/chat/:orderId (history)", r.status === 200 && Array.isArray(r.body), `count=${r.body.length}`);
    } catch (e) { log("GET /api/chat/:orderId (history)", false, e.message); }
  }

  // 29. Notifications: Get My
  try {
    const r = await request("GET", "/api/notifications/my", null, userToken);
    log("GET /api/notifications/my", r.status === 200 && Array.isArray(r.body), `count=${r.body.length}`);
  } catch (e) { log("GET /api/notifications/my", false, e.message); }

  // 30. Admin: Send Notification
  try {
    const r = await request("POST", "/api/notifications/send", {
      targetType: "all", title: "Test Notification", body: "This is a test"
    }, adminToken);
    log("POST /api/notifications/send", r.status === 200 && r.body.savedToInbox > 0, `saved=${r.body.savedToInbox}`);
  } catch (e) { log("POST /api/notifications/send", false, e.message); }

  // 31. Unauthorized access test
  try {
    const r = await request("GET", "/api/admin/dashboard", null, userToken);
    log("Auth Guard: user → admin (403)", r.status === 403, `status=${r.status}`);
  } catch (e) { log("Auth Guard: user → admin (403)", false, e.message); }

  // 32. No token test
  try {
    const r = await request("GET", "/api/orders");
    log("Auth Guard: no token (401)", r.status === 401, `status=${r.status}`);
  } catch (e) { log("Auth Guard: no token (401)", false, e.message); }

  // 33. FCM Token Update
  try {
    const r = await request("PATCH", "/api/auth/fcm-token", { fcmToken: "web_test_token_123" }, userToken);
    log("PATCH /api/auth/fcm-token", r.status === 200, r.body.message);
  } catch (e) { log("PATCH /api/auth/fcm-token", false, e.message); }

  // 34. Force Seed endpoint
  try {
    const r = await request("GET", "/api/force-seed");
    log("GET /api/force-seed", r.status === 200, r.body.message);
  } catch (e) { log("GET /api/force-seed", false, e.message); }

  // ── Summary ──
  console.log("\n═══════════════════════════════════════════════");
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`  Results: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log("═══════════════════════════════════════════════");

  if (failed > 0) {
    console.log("\nFailed tests:");
    results.filter((r) => !r.pass).forEach((r) => console.log(`  ❌ ${r.name}`));
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => { console.error("Test suite error:", e); process.exit(1); });
