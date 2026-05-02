import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";

const StatCard = ({ icon, label, value, color }) => (
  <div className="glass-panel" style={{ borderRadius: 14, padding: "16px 14px", display: "flex", alignItems: "center", gap: 12 }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}22`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 22, color }}>{icon}</span>
    </div>
    <div>
      <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "#181c1e", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: "#7a7484", marginTop: 3 }}>{label}</p>
    </div>
  </div>
);

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders = [] } = useQuery({
    queryKey: ["userOrders"],
    queryFn: () => api.get("/orders").then((r) => r.data),
  });

  const pending   = orders.filter((o) => o.status === "pending").length;
  const active    = orders.filter((o) => ["accepted","picked_up","in_transit"].includes(o.status)).length;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const recent    = orders.slice(0, 5);

  return (
    <div className="page-container animate-fade-in">

      {/* Greeting */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#181c1e" }}>
          Good day, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ fontSize: 13, color: "#7a7484", marginTop: 2 }}>Track and manage your deliveries</p>
      </div>

      {/* Mobile CTA */}
      <button onClick={() => navigate("/user/book")} className="btn-primary lg:hidden"
        style={{ width: "100%", padding: "13px", fontSize: "0.95rem", marginBottom: 18 }}>
        <span className="material-symbols-outlined filled" style={{ fontSize: 20 }}>add_circle</span>
        Book a New Delivery
      </button>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <StatCard icon="schedule"       label="Pending"   value={pending}   color="#B45309" />
        <StatCard icon="local_shipping" label="Active"    value={active}    color="#6b46c1" />
        <StatCard icon="check_circle"   label="Delivered" value={delivered} color="#15803D" />
      </div>

      {/* Recent orders */}
      <div className="glass-panel" style={{ borderRadius: 18, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.45)" }}>
          <h2 style={{ fontWeight: 700, color: "#181c1e", fontSize: "0.95rem" }}>Recent Orders</h2>
          <button onClick={() => navigate("/user/orders")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#6b46c1",
              fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
            View all
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          </button>
        </div>

        {recent.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: "#cbc3d5" }}>inbox</span>
            <p style={{ marginTop: 10, fontSize: 14, color: "#7a7484" }}>No orders yet</p>
          </div>
        ) : recent.map((o) => (
          <button key={o._id} onClick={() => navigate(`/user/orders/${o._id}`)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.35)",
              background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 12,
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.4)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#181c1e",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {o.pickupAddress}
              </p>
              <p style={{ fontSize: 11, color: "#7a7484", marginTop: 2,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                → {o.dropoffAddress}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              <StatusBadge status={o.status} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "#6b46c1" }}>৳{o.price}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserDashboard;
