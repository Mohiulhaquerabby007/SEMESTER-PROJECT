import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";
import DeliveryMap from "../../components/DeliveryMap";
import ChatBox from "../../components/ChatBox";

const next  = { accepted: "picked_up", picked_up: "in_transit", in_transit: "delivered" };
const nLabel= { accepted: "Mark Picked Up", picked_up: "Mark In Transit", in_transit: "Mark Delivered" };
const nColor= { accepted: "#0284c7", picked_up: "#f59e0b", in_transit: "var(--color-success)" };

const MyDeliveries = () => {
  const queryClient = useQueryClient();
  const [expandedMap, setExpandedMap] = useState(null);
  const [expandedChat, setExpandedChat] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["riderDeliveries"],
    queryFn: () => api.get("/riders/deliveries").then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/riders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success("Status updated!");
      queryClient.invalidateQueries({ queryKey: ["riderDeliveries"] });
      queryClient.invalidateQueries({ queryKey: ["riderEarnings"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Update failed"),
  });

  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const completed = orders.filter((o) => o.status === "delivered");

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-on-surface)" }}>My Deliveries</h1>
        <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", marginTop: 2 }}>
          {active.length} active · {completed.length} completed
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%",
            border: "3px solid var(--color-outline)", borderTopColor: "var(--color-primary)" }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel" style={{ borderRadius: 16, textAlign: "center", padding: "60px 20px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--color-outline-variant)" }}>local_shipping</span>
          <p style={{ marginTop: 12, fontWeight: 600, color: "var(--color-on-surface)" }}>No deliveries yet</p>
          <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", marginTop: 4 }}>Accept a job to get started</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {orders.map((o) => {
            const isMapExpanded = expandedMap === o._id;
            const isChatExpanded = expandedChat === o._id;
            const hasNext = !!next[o.status];

            return (
              <div key={o._id} className="glass-panel"
                style={{ borderRadius: 16, overflow: "hidden" }}>

                {/* Card header */}
                <div style={{ padding: "14px 16px" }}>
                  {/* Row 1: Status + price */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <StatusBadge status={o.status} />
                    <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--color-primary-container)" }}>৳{o.price}</span>
                  </div>

                  {/* Row 2: pickup */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-success)", flexShrink: 0, marginTop: 2 }}>
                      trip_origin
                    </span>
                    <span style={{ fontSize: 13, color: "var(--color-on-surface)", lineHeight: 1.4 }}>
                      {o.pickupAddress || "—"}
                    </span>
                  </div>

                  {/* Row 3: dropoff */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--color-primary-container)", flexShrink: 0, marginTop: 2 }}>
                      location_on
                    </span>
                    <span style={{ fontSize: 13, color: "var(--color-on-surface-variant)", lineHeight: 1.4 }}>
                      {o.dropoffAddress || "—"}
                    </span>
                  </div>

                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {[o.parcelType, `${o.distance} km`, `${o.weight} kg`].map((t) => (
                      <span key={t} style={{
                        padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-on-surface-variant)", textTransform: "capitalize",
                      }}>{t}</span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => { setExpandedMap(isMapExpanded ? null : o._id); setExpandedChat(null); }}
                      style={{
                        padding: "9px 14px", borderRadius: 8, border: "1.5px solid var(--color-outline-variant)",
                        background: "transparent", color: "var(--color-on-surface-variant)", fontSize: 13, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 5, flex: "0 0 auto",
                      }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>map</span>
                      {isMapExpanded ? "Hide" : "Map"}
                    </button>
                    
                    <button
                      onClick={() => { setExpandedChat(isChatExpanded ? null : o._id); setExpandedMap(null); }}
                      style={{
                        padding: "9px 14px", borderRadius: 8, border: "1.5px solid var(--color-outline-variant)",
                        background: isChatExpanded ? "rgba(139,92,246,0.15)" : "transparent", 
                        color: isChatExpanded ? "var(--color-primary-container)" : "var(--color-on-surface-variant)", 
                        fontSize: 13, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 5, flex: "0 0 auto",
                      }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chat</span>
                      Chat
                    </button>

                    {hasNext && (
                      <button
                        onClick={() => updateMutation.mutate({ id: o._id, status: next[o.status] })}
                        disabled={updateMutation.isPending}
                        style={{
                          flex: 1, padding: "9px 14px", borderRadius: 8, border: "none",
                          background: nColor[o.status] || "var(--color-primary)", color: "#fff",
                          fontSize: 13, fontWeight: 700, cursor: "pointer",
                          opacity: updateMutation.isPending ? 0.6 : 1,
                        }}>
                        {nLabel[o.status]}
                      </button>
                    )}
                  </div>
                </div>

                {/* Accordions */}
                {isMapExpanded && (
                  <div style={{ padding: "0 16px 16px" }}>
                    <DeliveryMap pickup={o.pickupAddress} dropoff={o.dropoffAddress} height="240px" />
                  </div>
                )}
                {isChatExpanded && (
                  <div style={{ padding: "0 16px 16px" }}>
                    <ChatBox orderId={o._id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyDeliveries;
