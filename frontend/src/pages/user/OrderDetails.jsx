import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import socket from "../../services/socket";
import StatusBadge from "../../components/StatusBadge";
import DeliveryMap from "../../components/DeliveryMap";
import ChatBox from "../../components/ChatBox";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
  });

  useEffect(() => {
    socket.emit("join_order_room", id);
    
    const handleStatusUpdate = (data) => {
      if (data.orderId === id) {
        toast("Order status updated!", { icon: "🔄" });
        queryClient.invalidateQueries({ queryKey: ["order", id] });
      }
    };

    socket.on("order_status_update", handleStatusUpdate);

    return () => {
      socket.off("order_status_update", handleStatusUpdate);
    };
  }, [id, queryClient]);


  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/orders/${id}/cancel`),
    onSuccess: () => {
      toast.success("Order cancelled");
      queryClient.invalidateQueries({ queryKey: ["userOrders"] });
      navigate("/user/orders");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Cannot cancel"),
  });

  if (isLoading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
      <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%",
        border: "3px solid #d0c0e4", borderTopColor: "#6b46c1" }} />
    </div>
  );
  if (!order) return null;

  return (
    <div className="page-container animate-fade-in">
      <button onClick={() => navigate("/user/orders")}
        style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
          color: "#6b46c1", fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 16, padding: 0 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
        Back to Orders
      </button>

      <div className="glass-panel" style={{ borderRadius: 20, overflow: "hidden" }}>

        {/* Header */}
        <div style={{
          padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(107,70,193,0.06)", borderBottom: "1px solid rgba(255,255,255,0.4)",
        }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: "1.1rem", color: "#181c1e" }}>Order Details</h1>
            <p style={{ fontSize: 11, color: "#7a7484", marginTop: 2 }}>#{order._id?.slice(-8).toUpperCase()}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Map */}
        {(order.pickupAddress || order.dropoffAddress) && (
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.4)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#7a7484", textTransform: "uppercase",
              letterSpacing: "0.05em", marginBottom: 10 }}>Route Map</p>
            <DeliveryMap pickup={order.pickupAddress} dropoff={order.dropoffAddress} height="260px" />
          </div>
        )}

        {/* Address details */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.4)" }}>
          {[
            { icon: "trip_origin", label: "Pickup",         value: order.pickupAddress,  color: "#15803D" },
            { icon: "call",        label: "Pickup Phone",   value: order.pickupPhone,    color: "#7a7484" },
            { icon: "location_on", label: "Drop-off",       value: order.dropoffAddress, color: "#6b46c1" },
            { icon: "call",        label: "Recipient Phone",value: order.dropoffPhone,   color: "#7a7484" },
          ].map(({ icon, label, value, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color, flexShrink: 0, marginTop: 1 }}>{icon}</span>
              <div>
                <p style={{ fontSize: 11, color: "#7a7484" }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: "#181c1e" }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderBottom: "1px solid rgba(255,255,255,0.4)" }}>
          {[["Type", order.parcelType], ["Weight", `${order.weight} kg`], ["Distance", `${order.distance} km`]].map(([k,v]) => (
            <div key={k} style={{ textAlign: "center", padding: "14px 8px", borderRight: "1px solid rgba(255,255,255,0.4)" }}>
              <p style={{ fontSize: 11, color: "#7a7484" }}>{k}</p>
              <p style={{ fontWeight: 700, fontSize: 15, color: "#181c1e", textTransform: "capitalize", marginTop: 2 }}>{v}</p>
            </div>
          ))}
        </div>

        {/* Price */}
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.4)", background: "rgba(107,70,193,0.04)" }}>
          <span style={{ color: "#7a7484", fontWeight: 500 }}>Total Price</span>
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6b46c1" }}>৳{order.price}</span>
        </div>

        {/* Rider info */}
        {order.rider && (
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.4)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#7a7484", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
              Assigned Rider
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#6b46c1",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {order.rider.name?.charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "#181c1e" }}>{order.rider.name}</p>
                <p style={{ fontSize: 12, color: "#7a7484" }}>{order.rider.phone} · {order.rider.vehicleType}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cancel */}
        {order.status === "pending" && (
          <div style={{ padding: "14px 20px" }}>
            <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}
              style={{
                width: "100%", padding: "12px", borderRadius: 10, fontWeight: 600, fontSize: 14,
                background: "#ffdad6", color: "#93000a", border: "1px solid #fecaca", cursor: "pointer",
              }}>
              {cancelMutation.isPending ? "Cancelling…" : "Cancel Order"}
            </button>
          </div>
        )}

        {/* Chat Box */}
        {order.rider && order.status !== "cancelled" && order.status !== "delivered" && (
          <div style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#7a7484", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Live Chat</p>
            <ChatBox orderId={order._id} />
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
