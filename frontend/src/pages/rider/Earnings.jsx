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
    { icon: "check_circle",   label: "Completed Deliveries", value: completed,       color: "#15803D", bg: "rgba(21,128,61,0.1)" },
    { icon: "account_balance_wallet", label: "Your Earnings", value: `৳${riderCut}`, color: "#6b46c1", bg: "rgba(107,70,193,0.1)" },
    { icon: "trending_up",    label: "Avg per Delivery",     value: `৳${avgOrder}`,  color: "#0369A1", bg: "rgba(3,105,161,0.1)" },
    { icon: "receipt",        label: "Platform Fee",         value: `৳${platform}`,  color: "#B45309", bg: "rgba(180,83,9,0.1)" },
  ];

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#181c1e" }}>My Earnings</h1>
        <p style={{ fontSize: 13, color: "#7a7484", marginTop: 2 }}>Your payout summary</p>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%",
            border: "3px solid #d0c0e4", borderTopColor: "#6b46c1" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── Total earnings hero ── */}
          <div style={{
            borderRadius: 18, padding: "28px 24px", textAlign: "center",
            background: "linear-gradient(135deg, #6b46c1, #532aa8)",
            boxShadow: "0 8px 32px rgba(83,42,168,0.30)",
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
                  <p style={{ fontSize: "1.15rem", fontWeight: 800, color: "#181c1e", lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: "#7a7484", marginTop: 3 }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Payout breakdown ── */}
          <div className="glass-panel" style={{ borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.45)",
              background: "rgba(107,70,193,0.05)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#7a7484",
                textTransform: "uppercase", letterSpacing: "0.08em" }}>Payout Breakdown</p>
            </div>
            {[
              ["Gross Revenue",   `৳${total}`,    "#181c1e"],
              ["Your Share (80%)",`৳${riderCut}`, "#15803D"],
              ["Platform (20%)",  `৳${platform}`, "#B45309"],
              ["Avg per Order",   `৳${avgOrder}`, "#6b46c1"],
            ].map(([k, v, c]) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.35)",
              }}>
                <span style={{ fontSize: 13, color: "#7a7484" }}>{k}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{v}</span>
              </div>
            ))}
          </div>

          {/* ── Progress bar visual ── */}
          <div className="glass-panel" style={{ borderRadius: 16, padding: "16px 18px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#7a7484",
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Earnings Split
            </p>
            <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 16, marginBottom: 10 }}>
              <div style={{ width: "80%", background: "#6b46c1" }} title="Your 80%" />
              <div style={{ width: "20%", background: "#B45309" }} title="Platform 20%" />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "#6b46c1" }} />
                <span style={{ fontSize: 11, color: "#7a7484" }}>Your share — 80%</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: "#B45309" }} />
                <span style={{ fontSize: 11, color: "#7a7484" }}>Platform — 20%</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Earnings;
