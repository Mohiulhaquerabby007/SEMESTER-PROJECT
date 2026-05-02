import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

const Register = () => {
  const [isRider, setIsRider] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", address: "", vehicleType: "bike",
  });
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--color-soft-lavender)" }}>
      <div className="w-full animate-slide-up" style={{ maxWidth: "420px" }}>

        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: "var(--color-primary-container)" }}>
            Create Account
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-outline)" }}>Join QuickDrop today</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 sm:p-7 shadow-xl"
          style={{ boxShadow: "0 16px 48px rgba(83,42,168,0.12)" }}>

          {/* Role tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-5"
            style={{ background: "var(--color-surface-container)" }}>
            {[["Customer", false], ["Rider", true]].map(([label, rider]) => (
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input id="reg-name" placeholder="Full name" value={form.name} onChange={update("name")} required />
            <input id="reg-email" type="email" placeholder="Email address" value={form.email} onChange={update("email")} required />
            <input id="reg-phone" placeholder="Phone number" value={form.phone} onChange={update("phone")} required />
            <input id="reg-password" type="password" placeholder="Password (min 6 chars)"
              value={form.password} onChange={update("password")} minLength={6} required />
            {!isRider && (
              <input id="reg-address" placeholder="Home address (optional)" value={form.address} onChange={update("address")} />
            )}
            {isRider && (
              <select id="reg-vehicle" value={form.vehicleType} onChange={update("vehicleType")}>
                <option value="bike">🏍️ Motorbike</option>
                <option value="car">🚗 Car</option>
                <option value="van">🚐 Van</option>
              </select>
            )}
            <button id="reg-submit" type="submit" disabled={loading}
              className="btn-primary w-full mt-1" style={{ padding: "13px" }}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: "var(--color-outline)" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold" style={{ color: "var(--color-primary-container)" }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
