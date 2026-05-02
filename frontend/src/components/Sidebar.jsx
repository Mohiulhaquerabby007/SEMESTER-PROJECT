import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const navConfig = {
  user: [
    { path: "/user/dashboard", icon: "dashboard",      label: "Dashboard" },
    { path: "/user/book",      icon: "local_shipping", label: "Book Delivery", filled: true },
    { path: "/user/orders",    icon: "history",        label: "Order History" },
    { path: "/user/profile",   icon: "person",         label: "Profile" },
  ],
  rider: [
    { path: "/rider/dashboard",  icon: "dashboard",      label: "Dashboard" },
    { path: "/rider/pending",    icon: "inbox",          label: "Available Jobs" },
    { path: "/rider/deliveries", icon: "local_shipping", label: "My Deliveries", filled: true },
    { path: "/rider/earnings",   icon: "payments",       label: "Earnings" },
  ],
  admin: [
    { path: "/admin/dashboard", icon: "bar_chart",       label: "Dashboard" },
    { path: "/admin/orders",    icon: "receipt_long",    label: "Orders" },
    { path: "/admin/users",     icon: "group",           label: "Users" },
    { path: "/admin/riders",    icon: "delivery_dining", label: "Riders" },
    { path: "/admin/coupons",   icon: "local_offer",     label: "Coupons" },
    { path: "/admin/notifications", icon: "campaign",    label: "Notifications" },
  ],
};

const roleLabel = { user: "Customer", rider: "Delivery Partner", admin: "Administrator" };

/* Sidebar content — rendered inside <aside className="app-sidebar"> in App.jsx */
const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;
  const items = navConfig[user.accountType] || [];
  const initials = user.name ? user.name.slice(0, 2).toUpperCase() : "QD";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "20px 16px", gap: 4 }}>

      {/* Brand */}
      <div style={{ marginBottom: 20, padding: "0 8px" }}>
        <div style={{ fontWeight: 800, fontSize: "1.4rem", color: "#6b46c1", letterSpacing: "-0.02em" }}>QuickDrop</div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#7a7484", textTransform: "uppercase" }}>
          Elite Delivery
        </div>
      </div>

      {/* CTA for user */}
      {user.accountType === "user" && (
        <button onClick={() => navigate("/user/book")} className="btn-primary" style={{ width: "100%", marginBottom: 12 }}>
          <span className="material-symbols-outlined filled" style={{ fontSize: 18 }}>add_circle</span>
          New Shipment
        </button>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button key={item.path} onClick={() => navigate(item.path)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, border: "none",
                background: active ? "rgba(107,70,193,0.13)" : "transparent",
                color: active ? "#6b46c1" : "#494453",
                fontWeight: active ? 700 : 500, fontSize: "0.875rem",
                cursor: "pointer", textAlign: "left", width: "100%",
                transition: "background .15s, color .15s",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.6)"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
              <span className={`material-symbols-outlined${active && item.filled ? " filled" : ""}`}
                style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6b46c1", flexShrink: 0 }} />}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.45)", paddingTop: 12, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "#6b46c1", color: "#fff", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
          }}>
            {user.profilePic ? (
              <img src={user.profilePic} alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#181c1e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name}
            </div>
            <div style={{ fontSize: 10, color: "#7a7484" }}>{roleLabel[user.accountType]}</div>
          </div>
          <button onClick={logout} title="Logout"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "#7a7484", display: "flex" }}
            onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
