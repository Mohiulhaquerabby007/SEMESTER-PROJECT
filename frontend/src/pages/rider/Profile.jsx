import { useAuth } from "../../context/AuthContext";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../services/api";

const VEHICLE_ICONS = { bike: "🏍️", car: "🚗", van: "🚐" };
const VEHICLE_LABELS = { bike: "Motorbike", car: "Car", van: "Van" };

const RiderProfile = () => {
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "QD";

  const { data: earnings } = useQuery({
    queryKey: ["riderEarnings"],
    queryFn: () => api.get("/riders/earnings").then((r) => r.data),
  });

  const availabilityMutation = useMutation({
    mutationFn: (isAvailable) =>
      api.patch("/riders/availability", { isAvailable }),
    onSuccess: (_, isAvailable) => {
      updateUser({ isAvailable });
      queryClient.invalidateQueries({ queryKey: ["riderEarnings"] });
      toast.success(
        isAvailable ? "You are now available for jobs" : "You are now offline"
      );
    },
    onError: () => toast.error("Failed to update availability"),
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file");

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let w = img.width, h = img.height;
        if (w > h) { if (w > 200) { h = Math.round((h * 200) / w); w = 200; } }
        else { if (h > 200) { w = Math.round((w * 200) / h); h = 200; } }
        canvas.width = w; canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const base64Str = canvas.toDataURL("image/webp", 0.8);
        try {
          const res = await api.patch("/auth/profile-pic", { profilePic: base64Str });
          updateUser({ profilePic: res.data.profilePic });
          toast.success("Profile picture updated!");
        } catch {
          toast.error("Failed to update profile picture");
        } finally {
          setIsUploading(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const isAvailable = user?.isAvailable ?? true;

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-on-surface)" }}>My Profile</h1>
        <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", marginTop: 2 }}>Manage your rider account</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Profile card ── */}
        <div className="glass-panel" style={{ borderRadius: 20, overflow: "hidden" }}>

          {/* Hero */}
          <div style={{
            padding: "32px 24px",
            display: "flex", flexDirection: "column", alignItems: "center",
            background: "rgba(0,0,0,0.15)",
            borderBottom: "1px solid var(--color-outline)",
          }}>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: "none" }} />

            <div
              onClick={() => !isUploading && fileInputRef.current.click()}
              title="Click to update profile picture"
              style={{
                width: 84, height: 84, borderRadius: "50%", background: "var(--color-primary)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "2rem", fontWeight: 800, marginBottom: 16,
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)", cursor: "pointer",
                position: "relative", overflow: "hidden", border: "2px solid var(--color-outline-variant)",
              }}
              onMouseEnter={e => { if (e.currentTarget.lastChild) e.currentTarget.lastChild.style.opacity = 1; }}
              onMouseLeave={e => { if (e.currentTarget.lastChild) e.currentTarget.lastChild.style.opacity = 0; }}
            >
              {isUploading ? (
                <div className="animate-spin" style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
              ) : user?.profilePic ? (
                <img src={user.profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initials
              )}
              <div style={{
                position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: 0, transition: "opacity 0.2s",
              }}>
                <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: 24 }}>photo_camera</span>
              </div>
            </div>

            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-on-surface)", marginBottom: 4 }}>
              {user?.name || "Rider"}
            </h2>
            <span style={{
              padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.08em",
              background: "rgba(139,92,246,0.15)", color: "var(--color-primary-container)",
            }}>
              {VEHICLE_ICONS[user?.vehicleType] || "🏍️"} Delivery Partner
            </span>
          </div>

          {/* Details */}
          <div style={{ padding: "8px 0" }}>
            {[
              { icon: "mail",         label: "Email Address",  value: user?.email },
              { icon: "call",         label: "Phone Number",   value: user?.phone },
              { icon: "two_wheeler",  label: "Vehicle Type",   value: VEHICLE_LABELS[user?.vehicleType] || user?.vehicleType || "N/A" },
              { icon: "check_circle", label: "Completed Deliveries", value: earnings?.completedDeliveries ?? "—" },
              { icon: "payments",     label: "Total Earnings (80%)", value: earnings ? `৳${Math.round(earnings.totalEarnings * 0.8).toLocaleString()}` : "—" },
            ].map(({ icon, label, value }, i, arr) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 16, padding: "16px 24px",
                borderBottom: i < arr.length - 1 ? "1px solid var(--color-outline)" : "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(139,92,246,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--color-primary-container)" }}>{icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-on-surface)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Availability toggle ── */}
        <div className="glass-panel" style={{ borderRadius: 16, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: isAvailable ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: isAvailable ? "var(--color-success)" : "var(--color-on-surface-variant)" }}>
                  {isAvailable ? "online_prediction" : "offline_pin"}
                </span>
              </div>
              <div>
                <p style={{ fontWeight: 700, color: "var(--color-on-surface)", fontSize: "0.95rem" }}>
                  {isAvailable ? "You're Online" : "You're Offline"}
                </p>
                <p style={{ fontSize: 12, color: "var(--color-on-surface-variant)", marginTop: 2 }}>
                  {isAvailable ? "Accepting new delivery requests" : "Not visible to dispatchers"}
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              onClick={() => availabilityMutation.mutate(!isAvailable)}
              disabled={availabilityMutation.isPending}
              style={{
                width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                background: isAvailable ? "var(--color-success)" : "rgba(255,255,255,0.15)",
                position: "relative", transition: "background 0.25s",
                flexShrink: 0, opacity: availabilityMutation.isPending ? 0.6 : 1,
              }}
            >
              <span style={{
                position: "absolute", top: 3,
                left: isAvailable ? 26 : 4,
                width: 22, height: 22, borderRadius: "50%",
                background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                transition: "left 0.25s",
              }} />
            </button>
          </div>
        </div>

        {/* ── Sign out ── */}
        <div className="glass-panel" style={{ borderRadius: 16, padding: "20px 24px" }}>
          <button onClick={logout}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: "0.95rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s", boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(220,38,38,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.3)"; }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
};

export default RiderProfile;
