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
    { icon: "payments",       label: "Earnings",  value: `৳${earnings?.totalEarnings || 0}`, color: "#15803D" },
    { icon: "local_shipping", label: "Active",    value: active,                              color: "#6b46c1" },
    { icon: "check_circle",   label: "Delivered", value: done,                                color: "#B45309" },
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
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#181c1e" }}>
          Welcome, {user?.name?.split(" ")[0]} 🏍️
        </h1>
        <p style={{ fontSize: 13, color: "#7a7484", marginTop: 2 }}>Manage your deliveries</p>
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
            <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "#181c1e", lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "#7a7484" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Quick actions (clearly below stats) ── */}
      <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#7a7484", textTransform: "uppercase",
        letterSpacing: "0.08em", marginBottom: 12 }}>
        Quick Actions
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {actions.map((a) => (
          <button key={a.path} onClick={() => navigate(a.path)}
            className="glass-panel"
            style={{
              borderRadius: 14, padding: "16px 18px", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 14, textAlign: "left",
              width: "100%", transition: "transform .15s, box-shadow .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(107,70,193,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none";             e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(107,70,193,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className={`material-symbols-outlined${a.filled ? " filled" : ""}`}
                style={{ fontSize: 22, color: "#6b46c1" }}>{a.icon}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: "#181c1e", fontSize: "0.95rem" }}>{a.label}</p>
              <p style={{ fontSize: 12, color: "#7a7484", marginTop: 2 }}>{a.desc}</p>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#cbc3d5" }}>
              chevron_right
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RiderDashboard;
