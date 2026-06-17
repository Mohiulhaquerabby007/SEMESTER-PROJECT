import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";

const STATUSES = ["pending", "accepted", "picked_up", "in_transit", "delivered", "cancelled"];

const AdminOrders = () => {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["adminOrders", filter, page],
    queryFn: () =>
      api.get(`/admin/orders?${filter ? `status=${filter}&` : ""}page=${page}&limit=15`)
        .then((r) => r.data),
  });

  const overrideMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => { toast.success("Status updated"); queryClient.invalidateQueries({ queryKey: ["adminOrders"] }); },
    onError: () => toast.error("Failed to update"),
  });

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-on-surface)" }}>All Orders</h1>
        <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", marginTop: 2 }}>{data?.total || 0} total orders</p>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}
        className="hide-scrollbar">
        <button onClick={() => { setFilter(""); setPage(1); }}
          style={{
            padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
            background: !filter ? "linear-gradient(135deg, #8b5cf6, #3b82f6)" : "rgba(15, 23, 42, 0.45)",
            color: "#fff",
            border: !filter ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: !filter ? "0 4px 14px rgba(139, 92, 246, 0.3)" : "none",
            cursor: "pointer", transition: "all .2s"
          }}
          onMouseEnter={e => { if (filter) e.currentTarget.style.background = "rgba(15, 23, 42, 0.65)"; }}
          onMouseLeave={e => { if (filter) e.currentTarget.style.background = "rgba(15, 23, 42, 0.45)"; }}>
          All Orders
        </button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            style={{
              padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 700, textTransform: "capitalize", whiteSpace: "nowrap", flexShrink: 0,
              background: filter === s ? "linear-gradient(135deg, #8b5cf6, #3b82f6)" : "rgba(15, 23, 42, 0.45)",
              color: "#fff",
              border: filter === s ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: filter === s ? "0 4px 14px rgba(139, 92, 246, 0.3)" : "none",
              cursor: "pointer", transition: "all .2s"
            }}
            onMouseEnter={e => { if (filter !== s) e.currentTarget.style.background = "rgba(15, 23, 42, 0.65)"; }}
            onMouseLeave={e => { if (filter !== s) e.currentTarget.style.background = "rgba(15, 23, 42, 0.45)"; }}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--color-primary)" }} />
        </div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 18, overflow: "hidden" }}>
          
          {/* Desktop table */}
          <div style={{ overflowX: "auto" }} className="hidden md:block">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.02)" }}>
                  {["Customer", "Route", "Price", "Status", "Date"].map((h) => (
                    <th key={h} style={{ padding: "12px 18px", textAlign: "left", fontWeight: 700,
                      color: "var(--color-on-surface-variant)", fontSize: 11, textTransform: "uppercase",
                      letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.orders || []).map((o, i) => (
                  <tr key={o._id} style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    background: i % 2 === 0 ? "rgba(255, 255, 255, 0.02)" : "transparent" }}>
                    <td style={{ padding: "12px 18px", fontWeight: 600, color: "var(--color-on-surface)", whiteSpace: "nowrap" }}>
                      {o.user?.name || "—"}
                    </td>
                    <td style={{ padding: "12px 18px", color: "var(--color-on-surface-variant)", maxWidth: 200 }}>
                      <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 13 }}>
                        <strong style={{ color: "var(--color-on-surface)", fontWeight: 600 }}>From:</strong> {o.pickupAddress}
                      </span>
                      <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 12, color: "var(--color-on-surface-variant)", marginTop: 2 }}>
                        <strong style={{ color: "var(--color-on-surface-variant)", fontWeight: 600 }}>To:</strong> {o.dropoffAddress}
                      </span>
                    </td>
                    <td style={{ padding: "12px 18px", fontWeight: 700, color: "var(--color-primary-container)", whiteSpace: "nowrap" }}>
                      ৳{o.price}
                    </td>
                    <td style={{ padding: "12px 18px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                        <StatusBadge status={o.status} />
                        <div style={{ position: "relative", width: 120 }}>
                          <select value={o.status}
                            onChange={(e) => overrideMutation.mutate({ id: o._id, status: e.target.value })}
                            style={{ 
                              padding: "6px 28px 6px 10px", fontSize: 12, fontWeight: 700, borderRadius: 8, 
                              border: "1px solid rgba(255, 255, 255, 0.15)", background: "rgba(15, 23, 42, 0.65)", 
                              color: "var(--color-on-surface)", cursor: "pointer", width: "100%", outline: "none",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.2)", textTransform: "capitalize",
                              appearance: "none", WebkitAppearance: "none", MozAppearance: "none"
                            }}>
                            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                          </select>
                          <span className="material-symbols-outlined" style={{
                            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                            fontSize: 16, color: "var(--color-on-surface-variant)", pointerEvents: "none"
                          }}>expand_more</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 18px", color: "var(--color-on-surface-variant)", whiteSpace: "nowrap", fontSize: 12 }}>
                      {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {(data?.orders || []).map((o) => (
              <div key={o._id} style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-on-surface)" }}>{o.user?.name || "—"}</p>
                    <p style={{ fontSize: 12, color: "var(--color-on-surface)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: "#10b981", verticalAlign: "middle", marginRight: 4 }}>trip_origin</span>
                      {o.pickupAddress}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--color-on-surface-variant)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13, color: "var(--color-primary)", verticalAlign: "middle", marginRight: 4 }}>location_on</span>
                      {o.dropoffAddress}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)", marginTop: 6 }}>
                      {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "var(--color-primary-container)" }}>৳{o.price}</span>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
                
                {/* Admin Action */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)" }}>Update Status:</span>
                  <div style={{ position: "relative", width: 120 }}>
                    <select value={o.status}
                      onChange={(e) => overrideMutation.mutate({ id: o._id, status: e.target.value })}
                      style={{ 
                        padding: "6px 28px 6px 10px", fontSize: 12, fontWeight: 700, borderRadius: 8, 
                        border: "1px solid rgba(255, 255, 255, 0.15)", background: "rgba(15, 23, 42, 0.65)", 
                        color: "var(--color-on-surface)", cursor: "pointer", width: "100%", outline: "none",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)", textTransform: "capitalize",
                        appearance: "none", WebkitAppearance: "none", MozAppearance: "none"
                      }}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                    </select>
                    <span className="material-symbols-outlined" style={{
                      position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                      fontSize: 16, color: "var(--color-on-surface-variant)", pointerEvents: "none"
                    }}>expand_more</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data?.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, padding: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-outline" style={{ padding: "6px 14px", fontSize: 13, opacity: page === 1 ? 0.5 : 1 }}>Prev</button>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-on-surface-variant)" }}>Page {page} of {data.pages}</span>
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                className="btn-outline" style={{ padding: "6px 14px", fontSize: 13, opacity: page === data.pages ? 0.5 : 1 }}>Next</button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default AdminOrders;
