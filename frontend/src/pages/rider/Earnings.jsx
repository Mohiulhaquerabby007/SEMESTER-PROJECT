import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";

const Earnings = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["riderEarnings"],
    queryFn: () => api.get("/riders/earnings").then((r) => r.data),
  });

  const total     = data?.totalEarnings     || 0;
  const completed = data?.completedDeliveries || 0;
  const riderCut  = Math.round(total * 0.8);
  const platform  = Math.round(total * 0.2);
  const avgOrder  = completed > 0 ? Math.round(riderCut / completed) : 0;

  const stats = [
    { icon: "check_circle",   label: "Completed Deliveries", value: completed,       color: "var(--color-success)", bg: "rgba(16,185,129,0.12)" },
    { icon: "account_balance_wallet", label: "Your Earnings", value: `৳${riderCut}`, color: "var(--color-primary-container)", bg: "rgba(139,92,246,0.12)" },
    { icon: "trending_up",    label: "Avg per Delivery",     value: `৳${avgOrder}`,  color: "#06B6D4", bg: "rgba(6,182,212,0.12)" },
    { icon: "receipt",        label: "Platform Fee",         value: `৳${platform}`,  color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  ];

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-on-surface)" }}>My Earnings</h1>
        <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", marginTop: 2 }}>Your payout summary</p>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%",
            border: "3px solid var(--color-outline)", borderTopColor: "var(--color-primary)" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── Total earnings hero ── */}
          <div style={{
            borderRadius: 18, padding: "28px 24px", textAlign: "center",
            background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.30)",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "rgba(255,255,255,0.8)" }}>
              payments
            </span>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 8 }}>
              Total Gross Earnings
            </p>
            <p style={{ fontSize: "2.8rem", fontWeight: 800, color: "#fff", lineHeight: 1.1, marginTop: 4 }}>
              ৳{total.toLocaleString()}
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
              Lifetime · {completed} deliveries completed
            </p>
          </div>

          {/* ── 4-stat grid ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
            {stats.map((s) => (
              <div key={s.label} className="glass-panel"
                style={{ borderRadius: 14, padding: "16px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: s.color }}>{s.icon}</span>
                </div>
                <div>
                  <p style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-on-surface)", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)", marginTop: 3 }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Payout breakdown ── */}
          <div className="glass-panel" style={{ borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--color-outline)",
              background: "rgba(0,0,0,0.15)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)",
                textTransform: "uppercase", letterSpacing: "0.08em" }}>Payout Breakdown</p>
            </div>
            {[
              ["Gross Revenue",   `৳${total}`,    "var(--color-on-surface)"],
              ["Your Share (80%)",`৳${riderCut}`, "var(--color-success)"],
              ["Platform (20%)",  `৳${platform}`, "#f59e0b"],
              ["Avg per Order",   `৳${avgOrder}`, "var(--color-primary-container)"],
            ].map(([k, v, c]) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "13px 18px", borderBottom: "1px solid var(--color-outline)",
              }}>
                <span style={{ fontSize: 13, color: "var(--color-on-surface-variant)" }}>{k}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</span>
              </div>
            ))}
          </div>

          {/* ── Progress bar visual ── */}
          <div className="glass-panel" style={{ borderRadius: 16, padding: "16px 18px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Earnings Split
            </p>
            <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 16, marginBottom: 10, background: "rgba(0,0,0,0.2)" }}>
              <div style={{ width: "80%", background: "var(--color-primary)" }} title="Your 80%" />
              <div style={{ width: "20%", background: "#f59e0b" }} title="Platform 20%" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--color-primary)" }} />
                <span style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>Your share — 80%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "#f59e0b" }} />
                <span style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>Platform — 20%</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Earnings;
