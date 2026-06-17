import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import StatusBadge from "../../components/StatusBadge";

/* ── Helpers ───────────────────────────────────────────────────────── */
const fmtTk = (n) => n >= 1000 ? `৳${(n / 1000).toFixed(1)}k` : `৳${n}`;
const fmt   = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0);

const fillDays = (trend, days) => {
  const map = {};
  trend.forEach((d) => { map[d._id] = d; });
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    const lbl = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return { label: lbl, value: map[key]?.revenue || map[key]?.count || 0 };
  });
};

/* ── SVG Bar Chart ─────────────────────────────────────────────────── */
const BarChart = ({ data, color = "#8b5cf6" }) => {
  if (!data.length) return <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <p style={{ color: "var(--color-on-surface-variant)", fontSize: 13 }}>No data yet</p></div>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 140, paddingBottom: 20, position: "relative" }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <div key={f} style={{ position: "absolute", left: 0, right: 0,
          top: `${(1 - f) * 120}px`, borderTop: "1px dashed var(--color-outline)", zIndex: 0 }} />
      ))}
      {data.map((d, i) => {
        const barH = Math.max((d.value / max) * 120, d.value > 0 ? 4 : 2);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, zIndex: 1 }}>
            <div title={`${d.label}: ${d.value}`} style={{
              width: "100%", height: `${barH}px`,
              background: `linear-gradient(180deg,${color},${color}88)`,
              borderRadius: "3px 3px 0 0", transition: "height 0.4s ease",
            }} />
            <span style={{ fontSize: 8, color: "var(--color-on-surface-variant)", whiteSpace: "nowrap",
              transform: "rotate(-35deg)", transformOrigin: "center", display: "block" }}>
              {d.label.split(" ")[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ── SVG Donut Chart ───────────────────────────────────────────────── */
const DonutChart = ({ segments, total }) => {
  const r = 50, cx = 65, cy = 65, circ = 2 * Math.PI * r;
  let cum = 0;
  const active = segments.filter((s) => s.value > 0);
  return (
    <svg viewBox="0 0 130 130" style={{ width: 130, height: 130, flexShrink: 0 }}>
      {total === 0
        ? <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="20" />
        : active.map((s, i) => {
            const dash = (s.value / total) * circ;
            const off  = -(cum / total) * circ - circ * 0.25;
            cum += s.value;
            return <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth="20"
              strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={off} />;
          })}
      <text x={cx} y={cy - 7} textAnchor="middle"
        style={{ fontSize: 20, fontWeight: 800, fill: "var(--color-on-surface)", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle"
        style={{ fontSize: 10, fill: "var(--color-on-surface-variant)", fontFamily: "Plus Jakarta Sans, sans-serif" }}>orders</text>
    </svg>
  );
};

/* ── KPI Card ──────────────────────────────────────────────────────── */
const KpiCard = ({ icon, label, value, sub, color, onClick }) => (
  <button onClick={onClick} style={{
    background: "rgba(15,23,42,0.45)", backdropFilter: "blur(16px)",
    border: "1px solid var(--color-outline)", borderRadius: 14,
    padding: "16px 14px", textAlign: "left", cursor: onClick ? "pointer" : "default",
    transition: "transform .15s, box-shadow .15s", width: "100%",
    display: "flex", alignItems: "center", gap: 12,
  }}
  onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)"; }}}
  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}22`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 20, color }}>{icon}</span>
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-on-surface)", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)", marginTop: 3, whiteSpace: "nowrap" }}>{label}</p>
      {sub && <p style={{ fontSize: 10, fontWeight: 600, color, marginTop: 2 }}>{sub}</p>}
    </div>
  </button>
);

const STATUS_COLORS = {
  pending: "#f59e0b", accepted: "var(--color-primary-container)", picked_up: "#0284c7",
  in_transit: "#10b981", delivered: "var(--color-success)", cancelled: "#ef4444",
};

/* ═══════════════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  const { data: leaderboards, error: leaderboardsError, isLoading: leaderboardsLoading } = useQuery({
    queryKey: ["adminLeaderboards"],
    queryFn: () => api.get("/admin/leaderboards").then((r) => r.data),
    enabled: isLeaderboardOpen,
  });

  const { data: kpi } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: () => api.get("/admin/dashboard").then((r) => r.data),
    refetchInterval: 60000,
  });
  const { data: analytics } = useQuery({
    queryKey: ["adminAnalytics"],
    queryFn: () => api.get("/admin/analytics?days=14").then((r) => r.data),
    refetchInterval: 60000,
  });
  const { data: topRiders = [] } = useQuery({
    queryKey: ["topRiders"],
    queryFn: () => api.get("/admin/top-riders").then((r) => r.data),
  });
  const { data: recentData } = useQuery({
    queryKey: ["adminRecentOrders"],
    queryFn: () => api.get("/admin/orders?limit=6").then((r) => r.data),
  });

  const recentOrders = recentData?.orders || [];
  const revenueBars  = analytics ? fillDays(analytics.revenueTrend, 14) : [];
  const orderBars    = analytics ? fillDays(analytics.orderTrend,   14) : [];

  const statusMap = {};
  (analytics?.statusDist || []).forEach((s) => { statusMap[s._id] = s.count; });
  const donutTotal = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const donutSegs  = Object.entries(STATUS_COLORS).map(([k, color]) => ({ label: k, value: statusMap[k] || 0, color }));

  const vehicleIcon = { bike: "🏍️", car: "🚗", van: "🚐" };

  return (
    <div className="page-container animate-fade-in">

      {/* ── Header ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-on-surface)" }}>Admin Dashboard</h1>
          <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", marginTop: 2 }}>Real-time platform overview</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setIsLeaderboardOpen(true)} style={{ padding: "8px 14px", fontSize: 13, background: "linear-gradient(135deg, #F59E0B, #B45309)", border: "none", color: "#fff", borderRadius: 8, display: "flex", alignItems: "center", gap: 6, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>emoji_events</span> Leaderboards
          </button>
          <button onClick={() => navigate("/admin/orders")} className="btn-outline" style={{ padding: "8px 14px", fontSize: 13 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>receipt_long</span> Orders
          </button>
          <button onClick={() => navigate("/admin/users")} className="btn-primary" style={{ padding: "8px 14px", fontSize: 13 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span> Users
          </button>
        </div>
      </div>

      {/* ── KPI Cards: 2-col → 3-col → 5-col ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2,1fr)",
        gap: 12, marginBottom: 20,
      }}
        className="sm:grid-cols-3 xl:grid-cols-5">
        <KpiCard icon="receipt_long"    label="Total Orders"  value={fmt(kpi?.totalOrders)}      color="var(--color-primary-container)" onClick={() => navigate("/admin/orders")} />
        <KpiCard icon="payments"        label="Revenue"       value={fmtTk(kpi?.totalRevenue||0)} color="var(--color-success)" />
        <KpiCard icon="local_shipping"  label="Active Now"    value={kpi?.activeDeliveries ?? 0}  color="#0284c7"
          sub={kpi?.activeDeliveries > 0 ? "in transit" : "none active"} />
        <KpiCard icon="group"           label="Customers"     value={kpi?.totalUsers ?? 0}        color="#f59e0b" onClick={() => navigate("/admin/users")} />
        <KpiCard icon="delivery_dining" label="Riders"        value={kpi?.totalRiders ?? 0}       color="var(--color-primary)" onClick={() => navigate("/admin/riders")} />
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 14 }}
        className="lg:grid-cols-3">

      {/* Revenue bar — 2/3 width on lg */}
        <div className="glass-panel lg:col-span-2" style={{ borderRadius: 18, padding: "20px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontWeight: 700, color: "var(--color-on-surface)", fontSize: "0.95rem" }}>Revenue Trend</h2>
              <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)", marginTop: 2 }}>Last 14 days (delivered orders)</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-success)", background: "rgba(16,185,129,0.15)",
              padding: "3px 10px", borderRadius: 999 }}>↑ Revenue</span>
          </div>
          <BarChart data={revenueBars} color="var(--color-primary)" />
        </div>

        {/* Donut — 1/3 width on lg */}
        <div className="glass-panel" style={{ borderRadius: 18, padding: "20px 18px" }}>
          <h2 style={{ fontWeight: 700, color: "var(--color-on-surface)", fontSize: "0.95rem", marginBottom: 2 }}>Order Status</h2>
          <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)", marginBottom: 16 }}>All time distribution</p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <DonutChart segments={donutSegs} total={donutTotal} />
            <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 10px" }}>
              {donutSegs.filter((s) => s.value > 0).map((s) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "var(--color-on-surface-variant)", textTransform: "capitalize", flex: 1 }}>
                    {s.label.replace("_"," ")}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Order activity + top riders ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 14 }}
        className="lg:grid-cols-3">

        {/* Order bar */}
        <div className="glass-panel lg:col-span-2" style={{ borderRadius: 18, padding: "20px 18px" }}>
          <h2 style={{ fontWeight: 700, color: "var(--color-on-surface)", fontSize: "0.95rem", marginBottom: 2 }}>Order Activity</h2>
          <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)", marginBottom: 16 }}>All orders placed per day</p>
          <BarChart data={orderBars} color="#0284c7" />
        </div>

        {/* Top riders */}
        <div className="glass-panel" style={{ borderRadius: 18, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--color-outline)",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontWeight: 700, color: "var(--color-on-surface)", fontSize: "0.95rem" }}>Top Riders</h2>
            <button onClick={() => navigate("/admin/riders")} style={{
              background: "none", border: "none", cursor: "pointer", color: "var(--color-primary-container)",
              fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
              View all <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
            </button>
          </div>
          {topRiders.length === 0
            ? <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--color-on-surface-variant)", fontSize: 13 }}>No rider data</div>
            : topRiders.map((r, i) => (
              <div key={r._id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
                borderBottom: "1px solid var(--color-outline)",
              }}>
                <span style={{ fontWeight: 800, fontSize: 12, width: 20, flexShrink: 0,
                  color: i === 0 ? "#F59E0B" : i === 1 ? "#94A3B8" : i === 2 ? "#f59e0b" : "var(--color-on-surface-variant)" }}>
                  #{i + 1}
                </span>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                  {r.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-on-surface)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.name} {vehicleIcon[r.vehicleType]}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>{r.completedDeliveries} deliveries</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-success)", flexShrink: 0 }}>
                  ৳{r.totalEarnings.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* ── Recent Orders ── */}
      <div className="glass-panel" style={{ borderRadius: 18, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", borderBottom: "1px solid var(--color-outline)" }}>
          <h2 style={{ fontWeight: 700, color: "var(--color-on-surface)", fontSize: "0.95rem" }}>Recent Orders</h2>
          <button onClick={() => navigate("/admin/orders")} style={{
            background: "none", border: "none", cursor: "pointer", color: "var(--color-primary-container)",
            fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
            View all <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_forward</span>
          </button>
        </div>

        {/* Desktop table */}
        <div style={{ overflowX: "auto" }} className="hidden md:block">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.15)" }}>
                {["Customer","From","To","Price","Status","Date"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 700,
                    color: "var(--color-on-surface-variant)", fontSize: 11, textTransform: "uppercase",
                    letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o, i) => (
                <tr key={o._id} style={{ borderTop: "1px solid var(--color-outline)",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                  <td style={{ padding: "11px 16px", fontWeight: 600, color: "var(--color-on-surface)", whiteSpace: "nowrap" }}>
                    {o.user?.name || "—"}
                  </td>
                  <td style={{ padding: "11px 16px", color: "var(--color-on-surface-variant)", maxWidth: 140 }}>
                    <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {o.pickupAddress}
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px", color: "var(--color-on-surface-variant)", maxWidth: 140 }}>
                    <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {o.dropoffAddress}
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px", fontWeight: 700, color: "var(--color-primary-container)", whiteSpace: "nowrap" }}>
                    ৳{o.price}
                  </td>
                  <td style={{ padding: "11px 16px" }}><StatusBadge status={o.status} /></td>
                  <td style={{ padding: "11px 16px", color: "var(--color-on-surface-variant)", whiteSpace: "nowrap" }}>
                    {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {recentOrders.map((o) => (
            <div key={o._id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-outline)",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: "var(--color-on-surface)" }}>{o.user?.name || "—"}</p>
                <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)", marginTop: 2,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {o.pickupAddress} → {o.dropoffAddress}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                <StatusBadge status={o.status} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary-container)" }}>৳{o.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Modal */}
      {isLeaderboardOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: 800, borderRadius: 24, overflow: "hidden", padding: 0, display: "flex", flexDirection: "column", maxHeight: "85vh" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", background: "rgba(0,0,0,0.15)", borderBottom: "1px solid var(--color-outline)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #F59E0B, #B45309)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <span className="material-symbols-outlined">emoji_events</span>
                </div>
                <div>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-on-surface)" }}>Live Leaderboards</h2>
                  <p style={{ fontSize: 12, color: "var(--color-on-surface-variant)" }}>Top performing partners and highest spending users</p>
                </div>
              </div>
              <button onClick={() => setIsLeaderboardOpen(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", color: "var(--color-on-surface-variant)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.1)"} onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,0.06)"}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, padding: 24, overflowY: "auto" }}>
              
              {/* Riders Leaderboard */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "var(--color-primary-container)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>two_wheeler</span>
                  Highest Income Riders
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {leaderboardsLoading ? (
                    <div className="animate-pulse" style={{ height: 60, background: "rgba(255,255,255,0.05)", borderRadius: 12 }} />
                  ) : leaderboardsError ? (
                    <div style={{ color: "red", padding: 10, background: "rgba(255,0,0,0.1)", borderRadius: 8 }}>
                      Error loading riders: {leaderboardsError.message}
                    </div>
                  ) : !leaderboards || leaderboards.topRiders.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", background: "rgba(0,0,0,0.1)", borderRadius: 14 }}>
                      <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", fontWeight: 600 }}>No rider data available yet</p>
                    </div>
                  ) : leaderboards.topRiders.map((r, i) => (
                    <div key={r._id} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.02)", padding: "12px 16px", borderRadius: 14, border: "1px solid var(--color-outline)" }}>
                      <span style={{ fontWeight: 800, fontSize: 16, width: 24, color: i === 0 ? "#F59E0B" : i === 1 ? "#94A3B8" : i === 2 ? "#f59e0b" : "var(--color-on-surface-variant)" }}>#{i + 1}</span>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, overflow: "hidden", flexShrink: 0 }}>
                        {r.profilePic ? <img src={r.profilePic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : r.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-on-surface)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</p>
                        <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>{vehicleIcon[r.vehicleType] || "🏍️"}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: "var(--color-success)" }}>৳{r.totalEarnings.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Users Leaderboard */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>shopping_bag</span>
                  Most Expenses (Users)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {leaderboardsLoading ? (
                    <div className="animate-pulse" style={{ height: 60, background: "rgba(255,255,255,0.05)", borderRadius: 12 }} />
                  ) : leaderboardsError ? (
                    <div style={{ color: "red", padding: 10, background: "rgba(255,0,0,0.1)", borderRadius: 8 }}>
                      Error loading users: {leaderboardsError.message}
                    </div>
                  ) : !leaderboards || leaderboards.topUsers.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", background: "rgba(0,0,0,0.1)", borderRadius: 14 }}>
                      <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", fontWeight: 600 }}>No user expenses found</p>
                    </div>
                  ) : leaderboards.topUsers.map((u, i) => (
                    <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.02)", padding: "12px 16px", borderRadius: 14, border: "1px solid var(--color-outline)" }}>
                      <span style={{ fontWeight: 800, fontSize: 16, width: 24, color: i === 0 ? "#F59E0B" : i === 1 ? "#94A3B8" : i === 2 ? "#f59e0b" : "var(--color-on-surface-variant)" }}>#{i + 1}</span>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--color-primary-container)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, overflow: "hidden", flexShrink: 0 }}>
                        {u.profilePic ? <img src={u.profilePic} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : u.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: "var(--color-on-surface)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</p>
                        <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>{u.count} deliveries</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: "#f59e0b" }}>৳{u.totalSpent.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
