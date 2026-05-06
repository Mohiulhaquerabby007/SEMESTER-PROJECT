import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import NotificationInbox from "./NotificationInbox";

const Header = () => {
  const { user } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ["myNotifications"],
    queryFn: () => api.get("/notifications/my").then((r) => Array.isArray(r.data) ? r.data : []),
    enabled: !!user && user.accountType !== "admin",
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!user) return null;

  return (
    <header 
      className="glass-header flex items-center justify-between px-4 sm:px-6"
      style={{ 
        height: 64, 
        position: "sticky", 
        top: 0, 
        zIndex: 100, 
        width: "100%",
        display: "flex",
        alignItems: "center"
      }}
    >
      {/* Left: Mobile Brand (Hidden on desktop) */}
      <div className="lg:hidden flex items-center gap-2">
        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#6b46c1", letterSpacing: "-0.02em" }}>
          QuickDrop
        </span>
      </div>

      {/* Right: Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
        
        {/* User Role Badge (Desktop) */}
        <span className="hidden sm:inline-flex" style={{ 
          fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: 999,
          background: "rgba(107,70,193,0.1)", color: "#6b46c1", textTransform: "capitalize" 
        }}>
          {user.accountType}
        </span>

        {/* Notification Bell */}
        {user.accountType !== "admin" && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 8, borderRadius: 12, color: "#494453",
                display: "flex", position: "relative",
                transition: "background 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(107,70,193,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <span className={`material-symbols-outlined ${unreadCount > 0 ? "filled animate-pulse-ring" : ""}`} 
                style={{ fontSize: 22, color: unreadCount > 0 ? "#6b46c1" : "inherit" }}>
                {unreadCount > 0 ? "notifications_active" : "notifications"}
              </span>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 6, right: 6,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: "#dc2626", color: "#fff",
                  fontSize: 9, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid #fff", padding: "0 2px"
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <>
                <div 
                  style={{ position: "fixed", inset: 0, zIndex: -1 }} 
                  onClick={() => setShowNotifs(false)} 
                />
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8 }}>
                  <NotificationInbox onClose={() => setShowNotifs(false)} />
                </div>
              </>
            )}
          </div>
        )}

        {/* User Mini Profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px", borderRadius: 12, background: "rgba(255,255,255,0.4)" }}>
          <div style={{ textAlign: "right", display: "none" }} className="md:block">
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#181c1e", lineHeight: 1.2 }}>{user.name.split(" ")[0]}</p>
            <p style={{ fontSize: "10px", color: "#7a7484", marginTop: 2 }}>{user.accountType}</p>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "#6b46c1", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "13px", flexShrink: 0, overflow: "hidden",
            boxShadow: "0 4px 10px rgba(107,70,193,0.2)"
          }}>
            {user.profilePic ? (
              <img src={user.profilePic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
