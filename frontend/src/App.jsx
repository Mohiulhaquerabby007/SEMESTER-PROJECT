import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import NetworkBadge from "./components/NetworkBadge";
import NotificationManager from "./components/NotificationManager";
import Header from "./components/Header";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import UserDashboard from "./pages/user/Dashboard";
import BookParcel from "./pages/user/BookParcel";
import OrderHistory from "./pages/user/OrderHistory";
import OrderDetails from "./pages/user/OrderDetails";
import Profile from "./pages/user/Profile";
import RiderDashboard from "./pages/rider/Dashboard";
import PendingOrders from "./pages/rider/PendingOrders";
import MyDeliveries from "./pages/rider/MyDeliveries";
import Earnings from "./pages/rider/Earnings";
import RiderProfile from "./pages/rider/Profile";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageRiders from "./pages/admin/ManageRiders";
import ManageCoupons from "./pages/admin/ManageCoupons";
import SendNotifications from "./pages/admin/SendNotifications";
import { usePushNotifications } from "./hooks/usePushNotifications";

const App = () => {
  const { user, loading } = useAuth();
  usePushNotifications(user);

  const getHome = () => {
    if (!user) return "/login";
    return { admin: "/admin/dashboard", rider: "/rider/dashboard", user: "/user/dashboard" }[user.accountType] || "/login";
  };

  const loggedIn = !!user;

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "var(--color-soft-lavender)",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          border: "4px solid #d0c0e4", borderTopColor: "#6b46c1",
          animation: "spin 0.7s linear infinite",
        }} />
        <p style={{ marginTop: 16, color: "#6b46c1", fontWeight: 600, fontSize: 14 }}>Loading QuickDrop…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    /* app-shell = flex row; sidebar is sticky column; content fills rest */
    <div className="app-shell">
      <NetworkBadge />
      <NotificationManager />

      {/* ── Sidebar (desktop only, via CSS .app-sidebar) ── */}
      {loggedIn && (
        <aside className="app-sidebar glass-sidebar">
          <Sidebar />
        </aside>
      )}

      {/* ── Main content column ── */}
      <div className="app-content">
        {loggedIn && <Header />}

        {/* Page content */}
        <main style={{ flex: 1, paddingBottom: loggedIn ? "72px" : 0 }} className="lg:!pb-0">
          <Routes>
            <Route path="/"         element={<Navigate to={getHome()} replace />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/user/dashboard"  element={<ProtectedRoute allowedTypes={["user"]}><UserDashboard /></ProtectedRoute>} />
            <Route path="/user/book"       element={<ProtectedRoute allowedTypes={["user"]}><BookParcel /></ProtectedRoute>} />
            <Route path="/user/orders"     element={<ProtectedRoute allowedTypes={["user"]}><OrderHistory /></ProtectedRoute>} />
            <Route path="/user/orders/:id" element={<ProtectedRoute allowedTypes={["user"]}><OrderDetails /></ProtectedRoute>} />
            <Route path="/user/profile"    element={<ProtectedRoute allowedTypes={["user", "admin"]}><Profile /></ProtectedRoute>} />

            <Route path="/rider/dashboard"  element={<ProtectedRoute allowedTypes={["rider"]}><RiderDashboard /></ProtectedRoute>} />
            <Route path="/rider/pending"    element={<ProtectedRoute allowedTypes={["rider"]}><PendingOrders /></ProtectedRoute>} />
            <Route path="/rider/deliveries" element={<ProtectedRoute allowedTypes={["rider"]}><MyDeliveries /></ProtectedRoute>} />
            <Route path="/rider/earnings"   element={<ProtectedRoute allowedTypes={["rider"]}><Earnings /></ProtectedRoute>} />
            <Route path="/rider/profile"    element={<ProtectedRoute allowedTypes={["rider"]}><RiderProfile /></ProtectedRoute>} />

            <Route path="/admin/dashboard" element={<ProtectedRoute allowedTypes={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/orders"    element={<ProtectedRoute allowedTypes={["admin"]}><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/users"     element={<ProtectedRoute allowedTypes={["admin"]}><ManageUsers /></ProtectedRoute>} />
            <Route path="/admin/riders"    element={<ProtectedRoute allowedTypes={["admin"]}><ManageRiders /></ProtectedRoute>} />
            <Route path="/admin/coupons"   element={<ProtectedRoute allowedTypes={["admin"]}><ManageCoupons /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute allowedTypes={["admin"]}><SendNotifications /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to={getHome()} replace />} />
          </Routes>
        </main>
      </div>

      {/* Bottom nav: mobile + tablet */}
      {loggedIn && <BottomNav />}
    </div>
  );
};

export default App;
