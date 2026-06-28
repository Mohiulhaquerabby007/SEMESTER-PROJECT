import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [isRider, setIsRider]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login, googleLogin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const redirect = (user) => {
    const routes = { admin: "/admin/dashboard", rider: "/rider/dashboard", user: "/user/dashboard" };
    navigate(routes[user.accountType] || "/user/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (!cleanEmail) {
      return toast.error("Email address is required");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return toast.error("Please enter a valid email address");
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    setLoading(true);
    try {
      const user = await login(cleanEmail, cleanPassword, isRider);
      toast.success(`Welcome back, ${user.name}! 👋`);
      redirect(user);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const user = await googleLogin(credentialResponse.credential);
      toast.success(`Welcome, ${user.name}! 🚀`);
      redirect(user);
    } catch (err) {
      console.error("Google Login Error:", err);
      toast.error(err.response?.data?.message || err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-8"
      style={{ 
        background: "var(--color-soft-lavender)",
        position: "relative",
        overflow: "hidden",
        transition: "background-color 0.3s ease"
      }}
    >
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

      <div className="w-full animate-slide-up" style={{ maxWidth: "480px", position: "relative", zIndex: 1 }}>

        {/* Brand */}
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
                e.target.parentNode.innerHTML = '<span class="material-symbols-outlined filled" style="font-size: 32px; color: var(--color-primary-container)">local_shipping</span>';
              }}
            />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: "var(--color-primary-container)", fontSize: "2.2rem" }}>
            QuickDrop
          </h1>
          <p className="mt-2 text-base font-medium" style={{ color: "var(--color-on-surface-variant)" }}>
            Fast & Reliable Elite Delivery
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl"
          style={{ 
            boxShadow: "var(--shadow-premium)",
            border: "1px solid var(--border-glass-panel)",
            background: "var(--bg-glass-panel)",
            backdropFilter: "blur(20px)"
          }}
        >
          {/* Role tabs */}
          <div
            className="flex gap-1.5 p-1.5 rounded-2xl mb-8"
            style={{ background: "rgba(0,0,0,0.08)" }}
          >
            {[["Customer Login", false], ["Rider Login", true]].map(([label, rider]) => (
              <button
                key={label}
                type="button"
                onClick={() => setIsRider(rider)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={{
                  background: isRider === rider ? "var(--color-primary-container)" : "transparent",
                  color: isRider === rider ? "#fff" : "var(--color-on-surface-variant)",
                  boxShadow: isRider === rider ? "0 4px 12px rgba(139,92,246,0.3)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2"
                style={{ fontSize: "20px", color: "var(--color-on-surface-variant)" }}
              >
                mail
              </span>
              <input
                id="login-email"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  paddingLeft: "48px", 
                  height: "56px", 
                  borderRadius: "16px",
                  fontSize: "16px",
                  border: "1.5px solid var(--border-input)",
                  background: "var(--bg-input)",
                  color: "var(--color-input-text)"
                }}
                required
              />
            </div>

            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2"
                style={{ fontSize: "20px", color: "var(--color-on-surface-variant)" }}
              >
                lock
              </span>
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  paddingLeft: "48px", 
                  paddingRight: "52px", 
                  height: "56px", 
                  borderRadius: "16px",
                  fontSize: "16px",
                  border: "1.5px solid var(--border-input)",
                  background: "var(--bg-input)",
                  color: "var(--color-input-text)"
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", padding: 8, cursor: "pointer",
                  color: "var(--color-on-surface-variant)", display: "flex"
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  {showPass ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
              style={{ 
                height: "56px", 
                borderRadius: "16px", 
                justifyContent: "center", 
                fontSize: "16px", 
                fontWeight: 800,
                boxShadow: "0 10px 20px rgba(139,92,246,0.3)"
              }}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 20, height: 20, borderRadius: "50%",
                      border: "3px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff", animation: "spin 0.7s linear infinite",
                    }}
                  />
                  <span>Signing in…</span>
                </div>
              ) : "Sign In"}
            </button>
          </form>

          {/* Divider — only show Google button for customer login */}
          {!isRider && (
            <>
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  margin: "24px 0", color: "var(--color-on-surface-variant)",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "var(--color-outline)" }} />
                <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>or continue with</span>
                <div style={{ flex: 1, height: 1, background: "var(--color-outline)" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google sign‑in failed")}
                  theme="outline"
                  size="large"
                  shape="pill"
                  logo_alignment="left"
                  text="signin_with_google"
                  width="100%"
                />
              </div>
            </>
          )}

          <p className="text-center text-base mt-8" style={{ color: "var(--color-on-surface-variant)", fontWeight: 500 }}>
            No account?{" "}
            <Link
              to="/register"
              className="font-extrabold"
              style={{ color: "var(--color-primary-container)", textDecoration: "none" }}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
