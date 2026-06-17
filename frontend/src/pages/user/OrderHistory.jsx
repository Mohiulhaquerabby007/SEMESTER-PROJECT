import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";

const OrderHistory = () => {
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["userOrders"],
    queryFn: () => api.get("/orders").then((r) => r.data),
  });

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-on-surface)" }}>Order History</h1>
        <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", marginTop: 2 }}>{orders.length} total deliveries</p>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%",
            border: "3px solid var(--color-outline)", borderTopColor: "var(--color-primary)" }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel" style={{ borderRadius: 18, textAlign: "center", padding: "60px 20px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--color-outline-variant)" }}>inventory_2</span>
          <p style={{ marginTop: 12, fontWeight: 700, color: "var(--color-on-surface)", fontSize: "1.1rem" }}>No orders yet</p>
          <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", marginTop: 4, marginBottom: 20 }}>Your deliveries will appear here</p>
          <button onClick={() => navigate("/user/book")} className="btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
            Book First Delivery
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.map((o) => (
            <button key={o._id} onClick={() => navigate(`/user/orders/${o._id}`)}
              className="glass-panel hover-card-trigger"
              style={{
                width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                padding: "18px 20px", borderRadius: 18, cursor: "pointer", textAlign: "left", gap: 12, 
              }}>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-success)", flexShrink: 0, marginTop: 1 }}>trip_origin</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-on-surface)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {o.pickupAddress}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-primary-container)", flexShrink: 0, marginTop: 1 }}>location_on</span>
                  <span style={{ fontSize: 13, color: "var(--color-on-surface-variant)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {o.dropoffAddress}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, paddingLeft: 28 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--color-on-surface-variant)" }}>calendar_today</span>
                  <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)", fontWeight: 600 }}>
                    {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "var(--color-primary-container)" }}>৳{o.price}</span>
                <StatusBadge status={o.status} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
