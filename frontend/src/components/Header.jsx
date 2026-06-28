import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import NotificationInbox from "./NotificationInbox";

const Header = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNotifs, setShowNotifs] = useState(false);
  const navigate = useNavigate();

  const profilePath = user?.accountType === "rider" ? "/rider/profile" : "/user/profile";

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
        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-primary-container)", letterSpacing: "-0.02em" }}>
          QuickDrop
        </span>
      </div>

      {/* Right: Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
        
        {/* User Role Badge (Desktop) */}
        <span className="hidden sm:inline-flex" style={{ 
          fontSize: "11px", fontWeight: 700, padding: "4px 12px", borderRadius: 999,
          background: "rgba(139, 92, 246, 0.15)", color: "var(--color-primary-container)", textTransform: "capitalize" 
        }}>
          {user.accountType}
        </span>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="hover-glass-btn"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            borderRadius: 12,
            color: "var(--color-on-surface-variant)",
            display: "flex",
            position: "relative",
          }}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
        </button>

        {/* Notification Bell */}
        {user.accountType !== "admin" && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="hover-glass-btn"
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 8, borderRadius: 12, color: "var(--color-on-surface-variant)",
                display: "flex", position: "relative",
              }}
            >
              <span className={`material-symbols-outlined ${unreadCount > 0 ? "filled animate-pulse-ring" : ""}`} 
                style={{ fontSize: 22, color: unreadCount > 0 ? "var(--color-primary-container)" : "inherit" }}>
                {unreadCount > 0 ? "notifications_active" : "notifications"}
              </span>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: 6, right: 6,
                  minWidth: 16, height: 16, borderRadius: 8,
                  background: "#dc2626", color: "#fff",
                  fontSize: 9, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid var(--color-surface-container)", padding: "0 2px"
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
        <div 
          onClick={() => navigate(profilePath)}
          title="View Profile"
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 10, 
            padding: "4px 8px", 
            borderRadius: 12, 
            background: "rgba(255,255,255,0.05)", 
            border: "1px solid rgba(255,255,255,0.05)",
            cursor: "pointer",
            transition: "background 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
        >
          <div style={{ textAlign: "right", display: "none" }} className="md:block">
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-on-surface)", lineHeight: 1.2 }}>{user.name.split(" ")[0]}</p>
            <p style={{ fontSize: "10px", color: "var(--color-on-surface-variant)", marginTop: 2 }}>{user.accountType}</p>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--color-primary)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "13px", flexShrink: 0, overflow: "hidden",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
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
