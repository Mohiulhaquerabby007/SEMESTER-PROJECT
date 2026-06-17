import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../../services/api";

/* ── Helpers ──────────────────────────────────────────────────────── */
const TARGETS = [
  { id: "all",    label: "Everyone",           sub: "Users & Riders",    icon: "public",         color: "#8b5cf6" },
  { id: "users",  label: "All Customers",      sub: "Registered users",  icon: "group",           color: "#3b82f6" },
  { id: "riders", label: "Delivery Partners",  sub: "Active riders",     icon: "delivery_dining", color: "#10b981" },
];

const TEMPLATES = [
  { icon: "🚀", label: "New Feature",   title: "🚀 New Feature Alert!",           body: "We've added exciting new features to QuickDrop. Update the app to experience them!" },
  { icon: "🎉", label: "Promo",         title: "🎉 Special Offer Just for You!",  body: "Use code QUICKSAVE at checkout for 20% off your next delivery. Limited time only!" },
  { icon: "⚡", label: "Flash Sale",    title: "⚡ Flash Sale — 1 Hour Only!",    body: "Book any parcel delivery right now and get ৳50 off. Offer expires soon!" },
  { icon: "📦", label: "Service Update",title: "📦 Service Update",               body: "We've improved our delivery tracking. You can now see real-time rider location!" },
  { icon: "🏆", label: "Rider Tips",    title: "🏆 Tips to Earn More",            body: "Stay online during peak hours (8–10am, 5–8pm) to get more delivery requests!" },
];

const EMPTY = { targetType: "all", title: "", body: "" };

/* ── Phone preview component ─────────────────────────────────────── */
const NotificationPreview = ({ title, body, targetType }) => {
  const target = TARGETS.find((t) => t.id === targetType);
  return (
    <div style={{ position: "relative" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
        Live Preview
      </p>

      {/* Phone frame */}
      <div style={{
        background: "#0b0f19", borderRadius: 24, padding: "32px 16px 24px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        border: "4px solid rgba(255, 255, 255, 0.1)", position: "relative",
      }}>
        {/* Notch */}
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          width: 60, height: 6, background: "rgba(255, 255, 255, 0.1)", borderRadius: 4 }} />

        {/* Notification bubble */}
        <div style={{
          background: "rgba(15, 23, 42, 0.85)", borderRadius: 16,
          padding: "14px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#fff" }}>local_shipping</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface)", flex: 1 }}>QuickDrop</span>
            <span style={{ fontSize: 10, color: "var(--color-on-surface-variant)" }}>now</span>
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-on-surface)", marginBottom: 4, lineHeight: 1.3 }}>
            {title || "Notification title will appear here"}
          </p>
          <p style={{ fontSize: 12, color: "var(--color-on-surface-variant)", lineHeight: 1.4 }}>
            {body || "Your message body will appear here..."}
          </p>
        </div>

        {/* Target badge */}
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
            → {target?.label}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
const SendNotifications = () => {
  const [form, setForm] = useState(EMPTY);
  const [history, setHistory] = useState([]);

  const { data: stats } = useQuery({
    queryKey: ["notifStats"],
    queryFn: async () => {
      // Fetch token counts: users+riders with fcmToken
      const [u, r] = await Promise.all([
        api.get("/admin/users").then((d) => d.data.users || d.data),
        api.get("/admin/riders").then((d) => d.data.riders || d.data),
      ]);
      const usersWithToken  = (Array.isArray(u) ? u : []).filter((x) => x.fcmToken).length;
      const ridersWithToken = (Array.isArray(r) ? r : []).filter((x) => x.fcmToken).length;
      return { users: usersWithToken, riders: ridersWithToken, total: usersWithToken + ridersWithToken };
    },
    retry: false,
  });

  const sendMutation = useMutation({
    mutationFn: (data) => api.post("/notifications/send", data),
    onSuccess: (res) => {
      const { successCount = 0, failureCount = 0 } = res.data;
      toast.success(`Sent! ✅ ${successCount} delivered · ❌ ${failureCount} failed`);
      setHistory((prev) => [
        {
          id: Date.now(),
          ...form,
          successCount,
          failureCount,
          sentAt: new Date(),
        },
        ...prev.slice(0, 9),
      ]);
      setForm(EMPTY);
    },
    onError: (e) => {
      const msg = e.response?.data?.message || "Failed to send";
      toast.error(msg);
    },
  });

  const applyTemplate = (t) => setForm((f) => ({ ...f, title: t.title, body: t.body }));

  const targetCount = () => {
    if (!stats) return null;
    if (form.targetType === "users")  return stats.users;
    if (form.targetType === "riders") return stats.riders;
    return stats.total;
  };
  const count = targetCount();

  return (
    <div className="page-container animate-fade-in">

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-on-surface)" }}>Push Notifications</h1>
        <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", marginTop: 2 }}>Broadcast messages to users and riders</p>
      </div>

      {/* ── Token stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { icon: "public",           label: "Total Subscribers", value: stats?.total    ?? "—", color: "#8b5cf6" },
          { icon: "group",            label: "Users w/ Push",      value: stats?.users    ?? "—", color: "#3b82f6" },
          { icon: "delivery_dining",  label: "Riders w/ Push",     value: stats?.riders   ?? "—", color: "#10b981" },
        ].map((s) => (
          <div key={s.label} className="glass-panel" style={{ borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}18`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-on-surface)", lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 10, color: "var(--color-on-surface-variant)", marginTop: 2 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-column layout on large screens ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}
           className="lg:grid-cols-[1fr_280px]">

        {/* ── LEFT: compose panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Target selector */}
          <div className="glass-panel" style={{ borderRadius: 16, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Target Audience
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {TARGETS.map((t) => {
                const active = form.targetType === t.id;
                return (
                  <button key={t.id} type="button" onClick={() => setForm({ ...form, targetType: t.id })}
                    style={{
                      padding: "12px 8px", borderRadius: 12, cursor: "pointer",
                      background: active ? t.color : "rgba(15, 23, 42, 0.45)",
                      color: "#fff",
                      border: active ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                      transition: "all 0.2s", textAlign: "center",
                      boxShadow: active ? `0 4px 14px ${t.color}44` : "none",
                    }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, display: "block", marginBottom: 4, color: active ? "#fff" : t.color }}>{t.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, display: "block" }}>{t.label}</span>
                    <span style={{ fontSize: 10, opacity: 0.75, display: "block", marginTop: 2 }}>{t.sub}</span>
                  </button>
                );
              })}
            </div>

            {count != null && (
              <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8,
                background: count === 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                border: count === 0 ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(16, 185, 129, 0.2)",
                display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: count === 0 ? "#f87171" : "#34d399" }}>
                  {count === 0 ? "warning" : "notifications_active"}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: count === 0 ? "#f87171" : "#34d399" }}>
                  {count === 0
                    ? "No subscribers with push enabled for this group"
                    : `${count} device${count !== 1 ? "s" : ""} will receive this notification`}
                </span>
              </div>
            )}
          </div>

          {/* Quick templates */}
          <div className="glass-panel" style={{ borderRadius: 16, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Quick Templates
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TEMPLATES.map((t) => (
                <button key={t.label} type="button" onClick={() => applyTemplate(t)}
                  style={{
                    padding: "7px 14px", borderRadius: 999, border: "1px solid rgba(255, 255, 255, 0.15)",
                    background: "rgba(15, 23, 42, 0.45)", color: "var(--color-on-surface-variant)", cursor: "pointer",
                    fontSize: 12, fontWeight: 600, transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary-container)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)"; e.currentTarget.style.color = "var(--color-on-surface-variant)"; }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compose */}
          <div className="glass-panel" style={{ borderRadius: 16, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              Compose Message
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Title *
                </label>
                <input
                  required maxLength={65}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. 🚀 Special Weekend Discount!"
                  style={{ fontSize: "1rem", fontWeight: 600 }}
                />
                <p style={{ fontSize: 10, color: "var(--color-on-surface-variant)", textAlign: "right", marginTop: 4 }}>{form.title.length}/65</p>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Message *
                </label>
                <textarea
                  required rows={4} maxLength={240}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Write a clear, engaging message for your users..."
                  style={{ resize: "vertical", minHeight: 100, lineHeight: 1.6 }}
                />
                <p style={{ fontSize: 10, color: "var(--color-on-surface-variant)", textAlign: "right", marginTop: 4 }}>{form.body.length}/240</p>
              </div>
            </div>
          </div>


          {/* Send button */}
          <button
            onClick={() => {
              if (!form.title.trim() || !form.body.trim()) return toast.error("Title and message are required");
              sendMutation.mutate(form);
            }}
            disabled={sendMutation.isPending || !form.title.trim() || !form.body.trim()}
            className="btn-primary"
            style={{ width: "100%", padding: "14px", fontSize: "1rem", justifyContent: "center" }}>
            {sendMutation.isPending ? (
              <><div className="animate-spin" style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff" }} /> Sending…</>
            ) : (
              <><span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span> Send Push Notification</>
            )}
          </button>
        </div>

        {/* ── RIGHT: preview + history ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Phone preview */}
          <div className="glass-panel" style={{ borderRadius: 16, padding: "18px 20px" }}>
            <NotificationPreview title={form.title} body={form.body} targetType={form.targetType} />
          </div>

          {/* Send history */}
          {history.length > 0 && (
            <div className="glass-panel" style={{ borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255, 255, 255, 0.02)" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Recent Sends
                </p>
              </div>
              {history.map((h) => (
                <div key={h.id} style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-on-surface)", marginBottom: 2,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {h.title}
                  </p>
                  <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--color-on-surface-variant)" }}>
                    <span style={{ color: "#34d399", fontWeight: 600 }}>✅ {h.successCount}</span>
                    {h.failureCount > 0 && <span style={{ color: "#f87171", fontWeight: 600 }}>❌ {h.failureCount}</span>}
                    <span>{h.sentAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SendNotifications;
