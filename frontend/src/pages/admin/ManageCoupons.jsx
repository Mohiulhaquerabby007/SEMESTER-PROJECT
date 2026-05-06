import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../../services/api";

/* ── Helpers ──────────────────────────────────────────────────────── */
const ADJECTIVES = ["MEGA","SUPER","FLASH","QUICK","ELITE","SPEED","BOLD","SWIFT"];
const NOUNS      = ["DEAL","DROP","SAVE","WIN","PLUS","RIDE","SHIP","PICK"];
const generateCode = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const num = Math.floor(10 + Math.random() * 90); // 10–99
  return `${adj}${num}`;
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => toast.success("Copied!", { icon: "📋" }));
};

const fmtDiscount = (c) =>
  c.discountType === "percentage" ? `${c.discountValue}%` : `৳${c.discountValue}`;

const isExpired = (c) => !c.isActive || new Date(c.expiryDate) < new Date();
const usageRatio = (c) => (c.maxUses === 0 ? 0 : c.usedCount / c.maxUses);

const PRESETS = [
  { label: "10% Off",   discountType: "percentage", discountValue: "10"  },
  { label: "20% Off",   discountType: "percentage", discountValue: "20"  },
  { label: "50% Off",   discountType: "percentage", discountValue: "50"  },
  { label: "৳50 Flat",  discountType: "fixed",       discountValue: "50"  },
  { label: "৳100 Flat", discountType: "fixed",       discountValue: "100" },
];

const EMPTY = { code: "", alias: "", discountType: "percentage", discountValue: "", maxUses: "1", expiryDate: "" };

/* ── Status badge ─────────────────────────────────────────────────── */
const StatusPill = ({ coupon }) => {
  if (isExpired(coupon)) {
    return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(185,28,28,0.1)", color: "#B91C1C" }}>Expired</span>;
  }
  const full = coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses;
  if (full) {
    return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(100,100,100,0.12)", color: "#555" }}>Used Up</span>;
  }
  return <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: "rgba(21,128,61,0.1)", color: "#15803D" }}>Active</span>;
};

/* ═══════════════════════════════════════════════════════════════════ */
const ManageCoupons = () => {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: () => api.get("/coupons").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post("/coupons", d),
    onSuccess: () => {
      toast.success("Coupon created!");
      qc.invalidateQueries({ queryKey: ["coupons"] });
      setShowModal(false);
      setForm(EMPTY);
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to create coupon"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/coupons/${id}`),
    onSuccess: () => {
      toast.success("Coupon deleted");
      qc.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: () => toast.error("Failed to delete coupon"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error("Coupon code is required");
    createMutation.mutate({
      ...form,
      discountValue: Number(form.discountValue),
      maxUses: Number(form.maxUses),
    });
  };

  const applyPreset = (preset) => setForm((f) => ({ ...f, ...preset }));

  const active   = coupons.filter((c) => !isExpired(c));
  const expired  = coupons.filter((c) => isExpired(c));

  return (
    <div className="page-container animate-fade-in">

      {/* ── Header ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#181c1e" }}>Manage Coupons</h1>
          <p style={{ fontSize: 13, color: "#7a7484", marginTop: 2 }}>
            {active.length} active · {expired.length} expired
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: "10px 18px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
          Create Coupon
        </button>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { icon: "local_offer",  label: "Total",   value: coupons.length,  color: "#6b46c1" },
          { icon: "check_circle", label: "Active",  value: active.length,   color: "#15803D" },
          { icon: "schedule",     label: "Expired", value: expired.length,  color: "#B91C1C" },
        ].map((s) => (
          <div key={s.label} className="glass-panel" style={{ borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}18`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: s.color }}>{s.icon}</span>
            </div>
            <div>
              <p style={{ fontSize: "1.3rem", fontWeight: 800, color: "#181c1e", lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "#7a7484", marginTop: 2 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Coupon cards ── */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #d0c0e4", borderTopColor: "#6b46c1" }} />
        </div>
      ) : coupons.length === 0 ? (
        <div className="glass-panel" style={{ borderRadius: 18, textAlign: "center", padding: "60px 20px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#cbc3d5" }}>local_offer</span>
          <p style={{ marginTop: 12, fontWeight: 700, color: "#181c1e", fontSize: "1.1rem" }}>No coupons yet</p>
          <p style={{ fontSize: 13, color: "#7a7484", marginTop: 4, marginBottom: 20 }}>Create your first discount code above</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_circle</span>
            Create Coupon
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {coupons.map((c) => {
            const expired = isExpired(c);
            const ratio   = usageRatio(c);
            return (
              <div key={c._id} className="glass-panel" style={{
                borderRadius: 16, padding: "16px 20px",
                opacity: expired ? 0.7 : 1,
                borderLeft: `4px solid ${expired ? "#B91C1C" : "#6b46c1"}`,
              }}>
                {/* Row 1: code + status + delete */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {/* Code chip */}
                    <button
                      onClick={() => copyToClipboard(c.code)}
                      title="Click to copy"
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "6px 14px", borderRadius: 8, border: "none",
                        background: "rgba(107,70,193,0.12)", cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(107,70,193,0.22)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(107,70,193,0.12)"}
                    >
                      <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.06em", color: "#6b46c1" }}>
                        {c.code}
                      </span>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#6b46c1" }}>content_copy</span>
                    </button>

                    {/* Alias badge */}
                    {c.alias && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: "#7a7484",
                        padding: "4px 10px", borderRadius: 999,
                        background: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.06)",
                      }}>
                        {c.alias}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusPill coupon={c} />
                    <button
                      onClick={() => { if (window.confirm("Delete this coupon?")) deleteMutation.mutate(c._id); }}
                      disabled={deleteMutation.isPending}
                      style={{ background: "rgba(185,28,28,0.08)", border: "none", color: "#B91C1C",
                        width: 32, height: 32, borderRadius: 8, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(185,28,28,0.18)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(185,28,28,0.08)"}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </div>
                </div>

                {/* Row 2: discount + uses + expiry */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#15803D" }}>sell</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}>{fmtDiscount(c)} discount</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#7a7484" }}>repeat</span>
                    <span style={{ fontSize: 13, color: "#494453" }}>
                      {c.usedCount} / {c.maxUses === 0 ? "∞" : c.maxUses} uses
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#7a7484" }}>calendar_today</span>
                    <span style={{ fontSize: 13, color: "#494453" }}>
                      Expires {new Date(c.expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Usage progress bar */}
                {c.maxUses > 0 && (
                  <div>
                    <div style={{ height: 4, borderRadius: 4, background: "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 4,
                        width: `${Math.min(ratio * 100, 100)}%`,
                        background: ratio >= 1 ? "#B91C1C" : ratio > 0.7 ? "#B45309" : "#6b46c1",
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                    <p style={{ fontSize: 10, color: "#7a7484", marginTop: 3 }}>
                      {Math.round(ratio * 100)}% of quota used
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Create Coupon Modal ═══ */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          zIndex: 999,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <style>{`
            @media (min-width: 600px) {
              .coupon-modal-wrapper {
                align-self: center !important;
                border-radius: 20px !important;
                max-height: 88vh !important;
              }
            }
          `}</style>
          <div className="glass-panel animate-slide-up coupon-modal-wrapper" style={{
            width: "100%", maxWidth: 540, borderRadius: "24px 24px 0 0",
            padding: 0, overflow: "hidden",
            maxHeight: "92vh", display: "flex", flexDirection: "column",
          }}>
            {/* Modal header */}
            <div style={{
              padding: "20px 24px 16px",
              background: "linear-gradient(135deg, rgba(107,70,193,0.12), rgba(83,42,168,0.03))",
              borderBottom: "1px solid rgba(255,255,255,0.4)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#6b46c1,#532aa8)",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#fff" }}>local_offer</span>
                </div>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#181c1e" }}>New Coupon</h2>
                  <p style={{ fontSize: 11, color: "#7a7484" }}>Set up a discount code for your users</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ background: "rgba(255,255,255,0.5)", border: "none", width: 32, height: 32, borderRadius: "50%",
                  cursor: "pointer", color: "#494453", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              <form onSubmit={handleSubmit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* ── Coupon Code ── */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7484", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                    Coupon Code *
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      required
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, "") })}
                      placeholder="e.g. SUMMER20"
                      style={{ flex: 1, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", fontSize: 15 }}
                    />
                    <button type="button"
                      onClick={() => setForm({ ...form, code: generateCode() })}
                      title="Auto-generate code"
                      style={{
                        padding: "0 14px", borderRadius: 8, border: "1.5px solid #cbc3d5",
                        background: "rgba(107,70,193,0.08)", color: "#6b46c1", cursor: "pointer",
                        fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 5,
                        flexShrink: 0, transition: "all 0.2s", whiteSpace: "nowrap",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(107,70,193,0.18)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(107,70,193,0.08)"}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
                      Generate
                    </button>
                  </div>
                  {form.code && (
                    <p style={{ fontSize: 11, color: "#7a7484", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>info</span>
                      Users enter this code at checkout
                    </p>
                  )}
                </div>

                {/* ── Alias (friendly name) ── */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7484", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                    Alias / Campaign Name
                    <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 6 }}>(optional)</span>
                  </label>
                  <input
                    value={form.alias}
                    onChange={(e) => setForm({ ...form, alias: e.target.value })}
                    placeholder="e.g. Summer Sale, New User Reward"
                  />
                </div>

                {/* ── Quick presets ── */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7484", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                    Quick Presets
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {PRESETS.map((p) => {
                      const active = form.discountType === p.discountType && form.discountValue === p.discountValue;
                      return (
                        <button key={p.label} type="button" onClick={() => applyPreset(p)}
                          style={{
                            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                            border: active ? "none" : "1.5px solid #cbc3d5",
                            background: active ? "#6b46c1" : "transparent",
                            color: active ? "#fff" : "#494453",
                            cursor: "pointer", transition: "all 0.15s",
                          }}>
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Discount type + value ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7484", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Type *</label>
                    <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                      style={{ width: "100%" }}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (৳)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7484", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Value *</label>
                    <div style={{ position: "relative" }}>
                      <span style={{
                        position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                        fontSize: 14, fontWeight: 700, color: "#6b46c1",
                      }}>
                        {form.discountType === "percentage" ? "%" : "৳"}
                      </span>
                      <input required type="number" min="1" max={form.discountType === "percentage" ? "100" : undefined}
                        value={form.discountValue}
                        onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                        placeholder={form.discountType === "percentage" ? "20" : "50"}
                        style={{ paddingLeft: 28, width: "100%" }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Max uses + expiry ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7484", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>
                      Max Uses
                      <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 4 }}>(0 = ∞)</span>
                    </label>
                    <input type="number" min="0" value={form.maxUses}
                      onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#7a7484", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Expiry Date *</label>
                    <input required type="date" value={form.expiryDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                      style={{ width: "100%" }} />
                  </div>
                </div>

                {/* ── Preview ── */}
                {form.code && form.discountValue && (
                  <div style={{
                    padding: "14px 16px", borderRadius: 12,
                    background: "linear-gradient(135deg, rgba(107,70,193,0.1), rgba(83,42,168,0.04))",
                    border: "1px dashed rgba(107,70,193,0.3)",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#6b46c1", flexShrink: 0 }}>confirmation_number</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#6b46c1", letterSpacing: "0.06em" }}>{form.code}</p>
                      {form.alias && <p style={{ fontSize: 11, color: "#7a7484" }}>{form.alias}</p>}
                      <p style={{ fontSize: 12, color: "#494453", marginTop: 2 }}>
                        {form.discountType === "percentage" ? `${form.discountValue}% off` : `৳${form.discountValue} flat discount`}
                        {form.maxUses > 0 ? ` · ${form.maxUses} uses` : " · Unlimited uses"}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Actions ── */}
                <div style={{ display: "flex", gap: 10, paddingBottom: 4 }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary" style={{ flex: 2 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {createMutation.isPending ? "sync" : "check_circle"}
                    </span>
                    {createMutation.isPending ? "Creating…" : "Create Coupon"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageCoupons;
