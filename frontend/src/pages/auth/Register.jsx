import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const Register = () => {
  const [isRider, setIsRider] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nidUploading, setNidUploading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", address: "", vehicleType: "bike", nidImage: ""
  });
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleNidUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return toast.error("Please upload an image file (JPEG/PNG)");
    }

    setNidUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        let width = img.width;
        let height = img.height;
        // Max dimension 800px to keep base64 string reasonable
        if (width > height) {
          if (width > 800) { height = Math.round((height * 800) / width); width = 800; }
        } else {
          if (height > 800) { width = Math.round((width * 800) / height); height = 800; }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64Str = canvas.toDataURL("image/webp", 0.8);
        setForm({ ...form, nidImage: base64Str });
        setNidUploading(false);
        toast.success("NID image attached!");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRider && !form.nidImage) {
      return toast.error("Please upload a picture of your NID Card");
    }
    setLoading(true);
    try {
      await register(form, isRider);
      toast.success("Account created! Welcome to QuickDrop.");
      navigate(isRider ? "/rider/dashboard" : "/user/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8"
      style={{ 
        background: "var(--color-soft-lavender)",
        position: "relative",
        overflow: "hidden",
        transition: "background-color 0.3s ease"
      }}>
      
      {/* Floating Theme Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
          background: "var(--bg-glass-panel)",
          border: "1px solid var(--border-glass-panel)",
          borderRadius: 12,
          padding: 10,
          cursor: "pointer",
          color: "var(--color-on-surface)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s"
        }}
        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
          {theme === "dark" ? "light_mode" : "dark_mode"}
        </span>
      </button>
      
      {/* Decorative background blobs */}
      <div style={{ position: "absolute", top: "-10%", right: "-10%", width: "40vw", height: "40vw", background: "rgba(139, 92, 246, 0.08)", borderRadius: "50%", filter: "blur(80px)" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "30vw", height: "30vw", background: "rgba(6, 182, 212, 0.05)", borderRadius: "50%", filter: "blur(60px)" }} />

      <div className="w-full animate-slide-up" style={{ maxWidth: "520px", position: "relative", zIndex: 1 }}>

        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-glass-panel)", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
          >
            <img 
              src="/logo.png" 
              alt="QuickDrop Logo" 
              style={{ width: "100%", height: "100%", objectFit: "contain", padding: "10px" }} 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<span class="material-symbols-outlined filled" style="font-size: 32px; color: var(--color-primary-container)">person_add</span>';
              }}
            />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: "var(--color-primary-container)", fontSize: "2.2rem" }}>
            Create Account
          </h1>
          <p className="mt-2 text-base font-medium" style={{ color: "var(--color-on-surface-variant)" }}>Join QuickDrop today</p>
        </div>

        <div className="glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl"
          style={{ 
            boxShadow: "var(--shadow-premium)",
            border: "1px solid var(--border-glass-panel)",
            background: "var(--bg-glass-panel)",
            backdropFilter: "blur(20px)"
          }}>

          {/* Role tabs */}
          <div className="flex gap-1.5 p-1.5 rounded-2xl mb-8"
            style={{ background: "rgba(0,0,0,0.08)" }}>
            {[["Customer", false], ["Rider", true]].map(([label, rider]) => (
              <button key={label} type="button" onClick={() => setIsRider(rider)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={{
                  background: isRider === rider ? "var(--color-primary-container)" : "transparent",
                  color: isRider === rider ? "#fff" : "var(--color-on-surface-variant)",
                  boxShadow: isRider === rider ? "0 4px 12px rgba(139,92,246,0.3)" : "none",
                }}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input id="reg-name" placeholder="Full name" value={form.name} onChange={update("name")} required 
                style={{ height: "54px", borderRadius: "14px", fontSize: "15px", border: "1.5px solid var(--border-input)", background: "var(--bg-input)", color: "var(--color-input-text)" }} />
              <input id="reg-phone" placeholder="Phone number" value={form.phone} onChange={update("phone")} required 
                style={{ height: "54px", borderRadius: "14px", fontSize: "15px", border: "1.5px solid var(--border-input)", background: "var(--bg-input)", color: "var(--color-input-text)" }} />
            </div>

            <input id="reg-email" type="email" placeholder="Email address" value={form.email} onChange={update("email")} required 
              style={{ height: "54px", borderRadius: "14px", fontSize: "15px", border: "1.5px solid var(--border-input)", background: "var(--bg-input)", color: "var(--color-input-text)" }} />
            
            <input id="reg-password" type="password" placeholder="Password (min 6 chars)"
              value={form.password} onChange={update("password")} minLength={6} required 
              style={{ height: "54px", borderRadius: "14px", fontSize: "15px", border: "1.5px solid var(--border-input)", background: "var(--bg-input)", color: "var(--color-input-text)" }} />
            
            {!isRider && (
              <input id="reg-address" placeholder="Home address (optional)" value={form.address} onChange={update("address")} 
                style={{ height: "54px", borderRadius: "14px", fontSize: "15px", border: "1.5px solid var(--border-input)", background: "var(--bg-input)", color: "var(--color-input-text)" }} />
            )}
            
            {isRider && (
              <>
                <select id="reg-vehicle" value={form.vehicleType} onChange={update("vehicleType")}
                  style={{ height: "54px", borderRadius: "14px", fontSize: "15px", border: "1.5px solid var(--border-input)", background: "var(--bg-input)", color: "var(--color-input-text)" }}>
                  <option value="bicycle">🚲 Bi-cycle</option>
                  <option value="bike">🏍️ Motorbike</option>
                  <option value="car">🚗 Car</option>
                  <option value="van">🚐 Van</option>
                </select>
                
                <div style={{
                  padding: "16px", borderRadius: "16px", border: "1px dashed var(--border-input)",
                  background: "var(--color-outline)", textAlign: "center", position: "relative"
                }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "var(--color-primary-container)", marginBottom: 8 }}>
                    Upload NID Card Picture *
                  </p>
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp" 
                    onChange={handleNidUpload}
                    style={{
                      position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                      opacity: 0, cursor: "pointer"
                    }}
                  />
                  <div style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: form.nidImage ? "var(--color-success)" : "var(--color-on-surface-variant)" }}>
                      {form.nidImage ? "check_circle" : "add_photo_alternate"}
                    </span>
                    <span style={{ fontSize: 14, color: form.nidImage ? "var(--color-success)" : "var(--color-on-surface-variant)", fontWeight: 700 }}>
                      {nidUploading ? "Uploading..." : form.nidImage ? "NID Attached" : "Click to select .jpeg / .png"}
                    </span>
                  </div>
                </div>
              </>
            )}

            <button id="reg-submit" type="submit" disabled={loading || nidUploading}
              className="btn-primary w-full mt-2" 
              style={{ 
                height: "56px", 
                borderRadius: "16px", 
                justifyContent: "center", 
                fontSize: "16px", 
                fontWeight: 800,
                boxShadow: "0 10px 20px rgba(139,92,246,0.3)"
              }}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-base mt-8" style={{ color: "var(--color-on-surface-variant)", fontWeight: 500 }}>
            Already have an account?{" "}
            <Link to="/login" className="font-extrabold" style={{ color: "var(--color-primary-container)", textDecoration: "none" }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
