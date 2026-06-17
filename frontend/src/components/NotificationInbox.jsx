import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

const NotificationInbox = ({ onClose }) => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["myNotifications"],
    queryFn: () => api.get("/notifications/my").then((r) => r.data),
    refetchInterval: 30000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read/all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myNotifications"] });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => api.delete("/notifications/delete/all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myNotifications"] });
      toast.success("Inbox cleared");
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id) => api.patch(`/notifications/read/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myNotifications"] });
    },
  });

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n.isRead).length;

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div 
      className="glass-panel animate-slide-down" 
      style={{ 
        width: "320px",
        maxHeight: "480px",
        borderRadius: "20px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(15, 23, 42, 0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(255, 255, 255, 0.02)"
      }}>
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 800, color: "var(--color-on-surface)" }}>Notifications</h3>
          <p style={{ fontSize: "10px", color: "var(--color-on-surface-variant)", fontWeight: 600 }}>{unreadCount} unread messages</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {safeNotifications.length > 0 && (
            <button
              onClick={() => deleteAllMutation.mutate()}
              style={{
                fontSize: "10px", fontWeight: 700, color: "#f87171",
                background: "rgba(239, 68, 68, 0.15)", border: "none", borderRadius: "6px",
                padding: "4px 8px", cursor: "pointer"
              }}
            >
              Clear all
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              style={{
                fontSize: "10px", fontWeight: 700, color: "var(--color-primary-container)",
                background: "rgba(139, 92, 246, 0.15)", border: "none", borderRadius: "6px",
                padding: "4px 8px", cursor: "pointer"
              }}
            >
              Mark all read
            </button>
          )}
          <button 
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-on-surface-variant)", display: "flex" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div className="animate-spin" style={{
              width: "24px", height: "24px", borderRadius: "50%", margin: "0 auto",
              border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--color-primary)"
            }} />
          </div>
        ) : safeNotifications.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--color-on-surface-variant)", display: "block", marginBottom: "8px" }}>
              notifications_none
            </span>
            <p style={{ color: "var(--color-on-surface-variant)", fontSize: "12px", fontWeight: 600 }}>All caught up!</p>
          </div>
        ) : (
          safeNotifications.map((n) => (
            <div
              key={n._id}
              onClick={() => { if (!n.isRead) markOneMutation.mutate(n._id); }}
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                background: n.isRead ? "transparent" : "rgba(255, 255, 255, 0.03)",
                cursor: n.isRead ? "pointer" : "default",
                display: "flex", gap: "12px",
                transition: "background 0.2s"
              }}
            >
              <div style={{
                width: "32px", height: "32px", borderRadius: "10px",
                background: n.isRead ? "rgba(255, 255, 255, 0.05)" : "rgba(139, 92, 246, 0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: n.isRead ? "var(--color-on-surface-variant)" : "var(--color-primary-container)" }}>
                  {n.title.toLowerCase().includes("offer") ? "local_offer" : "campaign"}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: n.isRead ? 600 : 800, fontSize: "12px", color: "var(--color-on-surface)", marginBottom: "2px" }}>
                  {n.title}
                </p>
                <p style={{ 
                  fontSize: "11px", color: "var(--color-on-surface-variant)", lineHeight: "1.4",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                }}>
                  {n.body}
                </p>
                <p style={{ fontSize: "9px", color: "var(--color-on-surface-variant)", marginTop: "4px", fontWeight: 700 }}>
                  {formatTime(n.createdAt)}
                </p>
              </div>
              {!n.isRead && (
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-primary)", marginTop: "4px" }} />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "10px",
        textAlign: "center",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        background: "rgba(15, 23, 42, 0.8)"
      }}>
        <button 
          style={{ 
            fontSize: "11px", fontWeight: 700, color: "var(--color-primary-container)",
            background: "none", border: "none", cursor: "pointer"
          }}
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationInbox;
