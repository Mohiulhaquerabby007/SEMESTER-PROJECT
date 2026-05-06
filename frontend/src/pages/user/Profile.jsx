import { useAuth } from "../../context/AuthContext";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState(user?.phone?.startsWith("google_") ? "" : user?.phone || "");
  const [editAddress, setEditAddress] = useState(user?.address || "");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveDetails = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await api.patch("/auth/profile-details", { 
        phone: editPhone, 
        address: editAddress 
      });
      updateUser({ phone: res.data.phone, address: res.data.address });
      setIsEditing(false);
      toast.success("Profile details updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile details");
    } finally {
      setIsSaving(false);
    }
  };

  const displayPhone = user?.phone?.startsWith("google_") ? "Not provided" : (user?.phone || "Not provided");

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#181c1e" }}>Profile</h1>
          <p style={{ fontSize: 13, color: "#7a7484", marginTop: 2 }}>Manage your account settings</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)}
            className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem", gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            Edit Profile
          </button>
        )}
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
          
          <div style={{ 
            display: "flex", alignItems: "center", gap: 16, padding: "16px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.35)", transition: "background 0.2s"
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(107,70,193,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#6b46c1" }}>mail</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: "#7a7484", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Email Address</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#181c1e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email}
              </p>
            </div>
          </div>

          <div style={{ 
            display: "flex", alignItems: "center", gap: 16, padding: "16px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.35)", transition: "background 0.2s"
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(107,70,193,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#6b46c1" }}>call</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: "#7a7484", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Phone Number</p>
              {isEditing ? (
                <input 
                  type="text" 
                  value={editPhone} 
                  onChange={(e) => setEditPhone(e.target.value)} 
                  placeholder="Enter phone number"
                  style={{ width: "100%", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(107,70,193,0.2)", fontSize: 14 }}
                />
              ) : (
                <p style={{ fontSize: 14, fontWeight: 600, color: "#181c1e" }}>{displayPhone}</p>
              )}
            </div>
          </div>

          <div style={{ 
            display: "flex", alignItems: "center", gap: 16, padding: "16px 24px",
            transition: "background 0.2s"
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(107,70,193,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#6b46c1" }}>home</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: "#7a7484", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Home Address</p>
              {isEditing ? (
                <textarea 
                  value={editAddress} 
                  onChange={(e) => setEditAddress(e.target.value)} 
                  placeholder="Enter default address"
                  rows={2}
                  style={{ width: "100%", padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(107,70,193,0.2)", fontSize: 14, resize: "none" }}
                />
              ) : (
                <p style={{ fontSize: 14, fontWeight: 600, color: "#181c1e" }}>{user?.address || "Not provided"}</p>
              )}
            </div>
          </div>

        </div>

        {/* Action Bar */}
        <div style={{ padding: "20px 24px", background: "rgba(255,255,255,0.2)", borderTop: "1px solid rgba(255,255,255,0.4)", display: "flex", gap: 12 }}>
          {isEditing ? (
            <>
              <button onClick={() => { setIsEditing(false); setEditPhone(displayPhone); setEditAddress(user?.address || ""); }}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(107,70,193,0.2)", cursor: "pointer",
                  background: "transparent", color: "#181c1e", fontWeight: 700, fontSize: "0.95rem"
                }}>
                Cancel
              </button>
              <button onClick={handleSaveDetails} disabled={isSaving}
                className="btn-primary" style={{ flex: 1, padding: "12px", justifyContent: "center" }}>
                {isSaving ? "Saving..." : "Save Details"}
              </button>
            </>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
