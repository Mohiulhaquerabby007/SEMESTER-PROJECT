import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";
import DeliveryMap from "../../components/DeliveryMap";

const PendingOrders = () => {
  const queryClient = useQueryClient();
  const [mapFor, setMapFor] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["pendingOrders"],
    queryFn: () => api.get("/riders/pending").then((r) => r.data),
    refetchInterval: 30000,
  });

  const acceptMutation = useMutation({
    mutationFn: (id) => api.patch(`/riders/${id}/accept`),
    onSuccess: () => {
      toast.success("Order accepted!");
      queryClient.invalidateQueries({ queryKey: ["pendingOrders"] });
      queryClient.invalidateQueries({ queryKey: ["riderDeliveries"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#181c1e" }}>Available Jobs</h1>
        <p style={{ fontSize: 13, color: "#7a7484", marginTop: 2 }}>{orders.length} orders waiting</p>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%",
            border: "3px solid #d0c0e4", borderTopColor: "#6b46c1" }} />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel" style={{ borderRadius: 16, textAlign: "center", padding: "60px 20px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#cbc3d5" }}>inbox</span>
          <p style={{ marginTop: 12, fontWeight: 600, color: "#181c1e" }}>No pending orders</p>
          <p style={{ fontSize: 13, color: "#7a7484", marginTop: 4 }}>New jobs will appear here</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          {orders.map((o) => {
            const showMap = mapFor === o._id;
            return (
              <div key={o._id} className="glass-panel" style={{ borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px" }}>
                  {/* Price + status */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <StatusBadge status={o.status} />
                    <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#6b46c1" }}>৳{o.price}</span>
                  </div>

                  {/* Pickup */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#15803D", flexShrink: 0, marginTop: 2 }}>trip_origin</span>
                    <span style={{ fontSize: 13, color: "#181c1e" }}>{o.pickupAddress}</span>
                  </div>

                  {/* Dropoff */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#6b46c1", flexShrink: 0, marginTop: 2 }}>location_on</span>
                    <span style={{ fontSize: 13, color: "#7a7484" }}>{o.dropoffAddress}</span>
                  </div>

                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {[o.parcelType, `${o.distance} km`, `${o.weight} kg`].map((t) => (
                      <span key={t} style={{
                        padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                        background: "#ebeef0", color: "#494453", textTransform: "capitalize",
                      }}>{t}</span>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setMapFor(showMap ? null : o._id)}
                      style={{
                        padding: "9px 14px", borderRadius: 8, border: "1.5px solid #cbc3d5",
                        background: showMap ? "rgba(107,70,193,0.1)" : "transparent",
                        color: showMap ? "#6b46c1" : "#494453",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>map</span>
                      {showMap ? "Hide Map" : "View Map"}
                    </button>
                    <button onClick={() => acceptMutation.mutate(o._id)}
                      disabled={acceptMutation.isPending} className="btn-primary" style={{ flex: 1 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                      Accept Delivery
                    </button>
                  </div>
                </div>

                {showMap && (
                  <div style={{ padding: "0 16px 16px" }}>
                    <DeliveryMap pickup={o.pickupAddress} dropoff={o.dropoffAddress} height="220px" />
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

export default PendingOrders;
