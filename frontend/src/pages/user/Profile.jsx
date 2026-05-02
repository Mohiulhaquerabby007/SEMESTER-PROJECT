import { useAuth } from "../../context/AuthContext";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "QD";

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Please upload an image file");
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // Resize logic (max 200x200 to keep base64 string small)
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > 200) { height = Math.round((height * 200) / width); width = 200; }
        } else {
          if (height > 200) { width = Math.round((width * 200) / height); height = 200; }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64Str = canvas.toDataURL("image/webp", 0.8);
        
        try {
          const res = await api.patch("/auth/profile-pic", { profilePic: base64Str });
          updateUser({ profilePic: res.data.profilePic });
          toast.success("Profile picture updated!");
        } catch (err) {
          toast.error("Failed to update profile picture");
        } finally {
          setIsUploading(false);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#181c1e" }}>Profile</h1>
        <p style={{ fontSize: 13, color: "#7a7484", marginTop: 2 }}>Manage your account settings</p>
      </div>

      <div className="glass-panel" style={{ maxWidth: 600, borderRadius: 20, overflow: "hidden", margin: "0 auto" }}>
        
        {/* Profile Hero */}
        <div style={{ 
          padding: "32px 24px", 
          display: "flex", flexDirection: "column", alignItems: "center",
          background: "linear-gradient(135deg, rgba(107,70,193,0.12), rgba(83,42,168,0.04))",
          borderBottom: "1px solid rgba(255,255,255,0.4)" 
        }}>
          
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            style={{ display: "none" }} 
          />

          <div 
            onClick={() => !isUploading && fileInputRef.current.click()}
            title="Click to update profile picture"
            style={{
              width: 84, height: 84, borderRadius: "50%", background: "#6b46c1",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "2rem", fontWeight: 800, marginBottom: 16,
              boxShadow: "0 8px 24px rgba(107,70,193,0.25)", cursor: "pointer",
              position: "relative", overflow: "hidden", border: "2px solid rgba(255,255,255,0.8)"
            }}
            onMouseEnter={e => {
              if (e.currentTarget.lastChild) e.currentTarget.lastChild.style.opacity = 1;
            }}
            onMouseLeave={e => {
              if (e.currentTarget.lastChild) e.currentTarget.lastChild.style.opacity = 0;
            }}
          >
            {isUploading ? (
              <div className="animate-spin" style={{ width: 24, height: 24, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
            ) : user?.profilePic ? (
              <img src={user.profilePic} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
            
            {/* Hover overlay with camera icon */}
            <div style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: 0, transition: "opacity 0.2s"
            }}>
              <span className="material-symbols-outlined" style={{ color: "#fff", fontSize: 24 }}>photo_camera</span>
            </div>
          </div>

          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#181c1e", marginBottom: 6 }}>
            {user?.name || "Unknown User"}
          </h2>
          <span style={{ 
            padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800,
            textTransform: "uppercase", letterSpacing: "0.08em",
            background: "rgba(107,70,193,0.15)", color: "#6b46c1" 
          }}>
            {user?.accountType || "USER"}
          </span>
        </div>

        {/* Profile Details */}
        <div style={{ padding: "8px 0" }}>
          {[
            { icon: "mail", label: "Email Address", value: user?.email },
            { icon: "call", label: "Phone Number", value: user?.phone },
            { icon: "home", label: "Home Address", value: user?.address || "Not provided" },
          ].map(({ icon, label, value }, i, arr) => (
            <div key={label} style={{ 
              display: "flex", alignItems: "center", gap: 16, padding: "16px 24px",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.35)" : "none",
              transition: "background 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.3)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(107,70,193,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#6b46c1" }}>{icon}</span>
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, color: "#7a7484", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>
                  {label}
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#181c1e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div style={{ padding: "20px 24px", background: "rgba(255,255,255,0.2)", borderTop: "1px solid rgba(255,255,255,0.4)" }}>
          <button onClick={logout}
            style={{
              width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: "0.95rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s", boxShadow: "0 4px 14px rgba(220,38,38,0.2)"
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(220,38,38,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(220,38,38,0.2)"; }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>logout</span>
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;
