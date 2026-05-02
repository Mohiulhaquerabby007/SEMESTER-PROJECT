import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const navConfig = {
  user: [
    { path: "/user/dashboard", icon: "dashboard",      label: "Home" },
    { path: "/user/book",      icon: "add_circle",     label: "Book",   filled: true },
    { path: "/user/orders",    icon: "history",        label: "Orders" },
    { path: "/user/profile",   icon: "person",         label: "Profile" },
  ],
  rider: [
    { path: "/rider/dashboard",  icon: "dashboard",      label: "Home" },
    { path: "/rider/pending",    icon: "inbox",          label: "Jobs" },
    { path: "/rider/deliveries", icon: "local_shipping", label: "Active", filled: true },
    { path: "/rider/earnings",   icon: "payments",       label: "Earnings" },
  ],
  admin: [
    { path: "/admin/dashboard", icon: "bar_chart",      label: "Overview" },
    { path: "/admin/orders",    icon: "receipt_long",   label: "Orders" },
    { path: "/admin/users",     icon: "group",          label: "Users" },
    { path: "/admin/riders",    icon: "delivery_dining",label: "Riders" },
  ],
};

const BottomNav = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;
  const items = navConfig[user.accountType] || [];

  return (
    /* Visible on mobile + tablet (< 1024px), hidden on desktop */
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav safe-bottom">
      <div className="flex justify-around items-stretch max-w-xl mx-auto">
        {items.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 relative transition-all duration-150"
              style={{ color: active ? "var(--color-primary-container)" : "var(--color-outline)" }}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{ width: "28px", height: "3px", background: "var(--color-primary-container)" }} />
              )}
              <span
                className={`material-symbols-outlined${active && item.filled ? " filled" : ""}`}
                style={{
                  fontSize: "22px",
                  transform: active ? "scale(1.1)" : "scale(1)",
                  transition: "transform 0.15s",
                }}
              >
                {item.icon}
              </span>
              <span style={{ fontSize: "10px", fontWeight: active ? 700 : 500, lineHeight: 1 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
