import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import socket from "../services/socket";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const NotificationManager = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !user._id) return;

    // Join the user's private room for direct notifications
    socket.emit("join_user_room", user._id);

    // Listen for real-time notifications
    const handleNewNotification = (notif) => {
      // Show a toast
      toast.custom((t) => (
        <div
          className={`${t.visible ? "animate-slide-up" : "animate-fade-out"} max-w-sm w-full shadow-lg pointer-events-auto flex`}
          style={{ 
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}
        >
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "rgba(139, 92, 246, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-primary-container)",
            flexShrink: 0
          }}>
            <span className="material-symbols-outlined filled">campaign</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "14px", color: "var(--color-on-surface)" }}>{notif.title}</p>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--color-on-surface-variant)", lineHeight: "1.4" }}>{notif.body}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{ 
              background: "none",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              color: "var(--color-on-surface-variant)"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>
      ), { duration: 6000 });

      // Invalidate queries to refresh notification lists and badges
      queryClient.invalidateQueries({ queryKey: ["myNotifications"] });
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [user, queryClient]);

  return null; // This is a logic-only component
};

export default NotificationManager;
