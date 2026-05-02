import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRider, setIsRider] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password, isRider);
      toast.success(`Welcome back, ${user.name}!`);
      const routes = { admin: "/admin/dashboard", rider: "/rider/dashboard", user: "/user/dashboard" };
      navigate(routes[user.accountType] || "/user/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--color-soft-lavender)" }}>
      <div className="w-full animate-slide-up" style={{ maxWidth: "420px" }}>

        {/* Brand header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
            style={{ background: "rgba(107,70,193,0.14)" }}>
            <span className="material-symbols-outlined filled"
              style={{ fontSize: "28px", color: "var(--color-primary-container)" }}>
              local_shipping
            </span>
          </div>
          <h1 className="text-3xl font-extrabold" style={{ color: "var(--color-primary-container)" }}>QuickDrop</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-outline)" }}>Fast &amp; Reliable Elite Delivery</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-5 sm:p-7 shadow-xl"
          style={{ boxShadow: "0 16px 48px rgba(83,42,168,0.12)" }}>

          {/* Role tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-5"
            style={{ background: "var(--color-surface-container)" }}>
            {[["Customer Login", false], ["Rider Login", true]].map(([label, rider]) => (
              <button key={label} onClick={() => setIsRider(rider)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: isRider === rider ? "var(--color-primary-container)" : "transparent",
                  color: isRider === rider ? "#fff" : "var(--color-on-surface-variant)",
                  boxShadow: isRider === rider ? "0 2px 8px rgba(107,70,193,0.28)" : "none",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
                style={{ fontSize: "18px", color: "var(--color-outline)" }}>mail</span>
              <input id="login-email" type="email" placeholder="Email address"
                value={email} onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "42px" }} required />
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2"
                style={{ fontSize: "18px", color: "var(--color-outline)" }}>lock</span>
              <input id="login-password" type="password" placeholder="Password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "42px" }} required />
            </div>
            <button id="login-submit" type="submit" disabled={loading}
              className="btn-primary w-full mt-1" style={{ padding: "13px" }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: "var(--color-outline)" }}>
            No account?{" "}
            <Link to="/register" className="font-semibold"
              style={{ color: "var(--color-primary-container)" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
