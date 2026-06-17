import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";

const RiderDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: deliveries = [] } = useQuery({
    queryKey: ["riderDeliveries"],
    queryFn: () => api.get("/riders/deliveries").then((r) => r.data),
  });

  const { data: earnings } = useQuery({
    queryKey: ["riderEarnings"],
    queryFn: () => api.get("/riders/earnings").then((r) => r.data),
  });

  const active = deliveries.filter((d) =>
    ["accepted", "picked_up", "in_transit"].includes(d.status)
  ).length;
  const done = deliveries.filter((d) => d.status === "delivered").length;

  const stats = [
    { icon: "payments",       label: "Earnings",  value: `৳${earnings?.totalEarnings || 0}`, color: "var(--color-success)" },
    { icon: "local_shipping", label: "Active",    value: active,                              color: "var(--color-primary-container)" },
    { icon: "check_circle",   label: "Delivered", value: done,                                color: "#f59e0b" },
  ];

  const actions = [
    { path: "/rider/pending",    icon: "inbox",          label: "Available Jobs",  desc: "Browse pending orders" },
    { path: "/rider/deliveries", icon: "local_shipping", label: "My Deliveries",   desc: "Track active orders",  filled: true },
    { path: "/rider/earnings",   icon: "payments",       label: "My Earnings",     desc: "View payout history" },
  ];

  return (
    <div className="page-container animate-fade-in">

      {/* Greeting */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-on-surface)" }}>
          Welcome, {user?.name?.split(" ")[0]} 🏍️
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", marginTop: 2 }}>Manage your deliveries</p>
      </div>

      {/* ── Stats row ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        marginBottom: 20,
      }}>
        {stats.map((s) => (
          <div key={s.label} className="glass-panel"
            style={{ borderRadius: 14, padding: "16px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 26, color: s.color }}>{s.icon}</span>
            <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-on-surface)", lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Quick actions (clearly below stats) ── */}
      <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-on-surface-variant)", textTransform: "uppercase",
        letterSpacing: "0.08em", marginBottom: 12 }}>
        Quick Actions
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {actions.map((a) => (
          <button key={a.path} onClick={() => navigate(a.path)}
            className="glass-panel hover-card-trigger"
            style={{
              borderRadius: 14, padding: "16px 18px", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 14, textAlign: "left",
              width: "100%",
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(139,92,246,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className={`material-symbols-outlined${a.filled ? " filled" : ""}`}
                style={{ fontSize: 22, color: "var(--color-primary-container)" }}>{a.icon}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: "var(--color-on-surface)", fontSize: "0.95rem" }}>{a.label}</p>
              <p style={{ fontSize: 12, color: "var(--color-on-surface-variant)", marginTop: 2 }}>{a.desc}</p>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-outline-variant)" }}>
              chevron_right
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RiderDashboard;
