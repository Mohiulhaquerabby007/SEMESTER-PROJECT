import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
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
  const navigate = useNavigate();

  const redirect = (user) => {
    const routes = { admin: "/admin/dashboard", rider: "/rider/dashboard", user: "/user/dashboard" };
    navigate(routes[user.accountType] || "/user/dashboard");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password, isRider);
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
        background: "#E5D9F2",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Decorative background blobs */}
      <div style={{ position: "absolute", top: "-10%", right: "-10%", width: "40vw", height: "40vw", background: "rgba(107,70,193,0.05)", borderRadius: "50%", filter: "blur(80px)" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "30vw", height: "30vw", background: "rgba(107,70,193,0.03)", borderRadius: "50%", filter: "blur(60px)" }} />

      <div className="w-full animate-slide-up" style={{ maxWidth: "480px", position: "relative", zIndex: 1 }}>

        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 overflow-hidden"
            style={{ background: "rgba(107,70,193,0.1)", boxShadow: "0 10px 25px rgba(107,70,193,0.15)" }}
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
          <p className="mt-2 text-base font-medium" style={{ color: "#7a7484" }}>
            Fast & Reliable Elite Delivery
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl"
          style={{ 
            boxShadow: "0 25px 50px -12px rgba(83,42,168,0.15)",
            border: "1px solid rgba(255,255,255,0.8)",
            background: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(20px)"
          }}
        >
          {/* Role tabs */}
          <div
            className="flex gap-1.5 p-1.5 rounded-2xl mb-8"
            style={{ background: "rgba(0,0,0,0.04)" }}
          >
            {[["Customer Login", false], ["Rider Login", true]].map(([label, rider]) => (
              <button
                key={label}
                type="button"
                onClick={() => setIsRider(rider)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={{
                  background: isRider === rider ? "var(--color-primary-container)" : "transparent",
                  color: isRider === rider ? "#fff" : "#494453",
                  boxShadow: isRider === rider ? "0 4px 12px rgba(107,70,193,0.3)" : "none",
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
                style={{ fontSize: "20px", color: "#7a7484" }}
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
                  border: "1px solid rgba(107,70,193,0.1)",
                  background: "#fff"
                }}
                required
              />
            </div>

            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2"
                style={{ fontSize: "20px", color: "#7a7484" }}
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
                  border: "1px solid rgba(107,70,193,0.1)",
                  background: "#fff"
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", padding: 8, cursor: "pointer",
                  color: "#7a7484", display: "flex"
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
                boxShadow: "0 10px 20px rgba(107,70,193,0.25)"
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
                  margin: "24px 0", color: "#7a7484",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
                <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>or continue with</span>
                <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.06)" }} />
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

          <p className="text-center text-base mt-8" style={{ color: "#494453", fontWeight: 500 }}>
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
