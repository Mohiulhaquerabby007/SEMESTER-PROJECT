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
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#181c1e" }}>Order History</h1>
        <p style={{ fontSize: 13, color: "#7a7484", marginTop: 2 }}>{orders.length} total deliveries</p>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%",
            border: "3px solid #d0c0e4", borderTopColor: "#6b46c1" }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel" style={{ borderRadius: 18, textAlign: "center", padding: "60px 20px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#cbc3d5" }}>inventory_2</span>
          <p style={{ marginTop: 12, fontWeight: 700, color: "#181c1e", fontSize: "1.1rem" }}>No orders yet</p>
          <p style={{ fontSize: 13, color: "#7a7484", marginTop: 4, marginBottom: 20 }}>Your deliveries will appear here</p>
          <button onClick={() => navigate("/user/book")} className="btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
            Book First Delivery
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.map((o) => (
            <button key={o._id} onClick={() => navigate(`/user/orders/${o._id}`)}
              className="glass-panel"
              style={{
                width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                padding: "18px 20px", borderRadius: 18, border: "none", cursor: "pointer", textAlign: "left", gap: 12, 
                transition: "transform 0.2s, box-shadow 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(107,70,193,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#15803D", flexShrink: 0, marginTop: 1 }}>trip_origin</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#181c1e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {o.pickupAddress}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#6b46c1", flexShrink: 0, marginTop: 1 }}>location_on</span>
                  <span style={{ fontSize: 13, color: "#7a7484", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {o.dropoffAddress}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, paddingLeft: 28 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#a19dad" }}>calendar_today</span>
                  <p style={{ fontSize: 11, color: "#7a7484", fontWeight: 600 }}>
                    {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#6b46c1" }}>৳{o.price}</span>
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
