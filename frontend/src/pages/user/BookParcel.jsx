import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import { saveOrderLocally, getNetworkStatus } from "../../services/syncService";
import DeliveryMap from "../../components/DeliveryMap";

const calcDiscountedPrice = (price, coupon) => {
  if (!coupon) return price;
  if (coupon.discountType === "percentage") {
    return Math.max(0, Math.round(price - price * (coupon.discountValue / 100)));
  }
  return Math.max(0, Math.round(price - coupon.discountValue));
};

const TYPES = [
  { value: "document", label: "Document", icon: "description" },
  { value: "small",    label: "Small",    icon: "inventory_2" },
  { value: "medium",   label: "Medium",   icon: "package_2" },
  { value: "large",    label: "Large",    icon: "deployed_code" },
];

const SectionTitle = ({ n, title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--color-primary-container)",
      color: "#fff", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {n}
    </div>
    <h3 style={{ fontWeight: 700, color: "var(--color-on-surface)", fontSize: "0.9rem" }}>{title}</h3>
  </div>
);

// Helper functions for distance calculation
const geocodeCache = {};
const geocode = async (address) => {
  if (geocodeCache[address]) return geocodeCache[address];
  try {
    const q = encodeURIComponent(`${address}, Bangladesh`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`, { headers: { "User-Agent": "QuickDrop/1.0" } });
    const data = await res.json();
    if (data.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geocodeCache[address] = coords;
      return coords;
    }
  } catch (err) { console.error("Geocode error", err); }
  return null;
};

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
};

const BookParcel = () => {
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const [step, setStep] = useState(1);
  const [price, setPrice] = useState(null);
  const [isCalculatingLoc, setIsCalculatingLoc] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const { user } = useAuth();
  const [form, setForm] = useState({
    pickupAddress: user?.address || "", 
    pickupPhone: user?.phone?.startsWith("google_") ? "" : (user?.phone || ""), 
    dropoffAddress: "", 
    dropoffPhone: "",
    parcelType: "small", weight: "", distance: "", notes: "",
  });

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const showMap = form.pickupAddress.length > 4 || form.dropoffAddress.length > 4;

  const priceMutation = useMutation({
    mutationFn: (d) => api.post("/orders/price", d),
    onSuccess: (r) => { setPrice(r.data.price); setAppliedCoupon(null); setCouponCode(""); setStep(3); },
    onError: () => {
      const wt = { document: 0, small: 10, medium: 25, large: 50 };
      setPrice(Math.round(60 + +form.distance * 15 + (wt[form.parcelType] || 0)));
      setAppliedCoupon(null); setCouponCode(""); setStep(3);
    },
  });

  const couponMutation = useMutation({
    mutationFn: (code) => api.post("/coupons/validate", { code }),
    onSuccess: (r) => {
      setAppliedCoupon(r.data);
      toast.success(`Coupon applied! Saving ${r.data.discountType === "percentage" ? r.data.discountValue + "%" : "৳" + r.data.discountValue}`, { icon: "🎉" });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Invalid coupon"),
  });

  const orderMutation = useMutation({
    mutationFn: async (d) => {
      if (!getNetworkStatus()) return saveOrderLocally(d);
      return (await api.post("/orders", d)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userOrders"] });
      toast.success(getNetworkStatus() ? "Order placed!" : "Saved offline — syncs when online");
      navigate("/user/orders");
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed"),
  });

  const finalPrice = calcDiscountedPrice(price, appliedCoupon);
  const savings    = price != null ? price - finalPrice : 0;

  const stepLabels = ["Addresses", "Details", "Confirm"];

  const handleNextStep1 = async () => {
    if (!form.pickupAddress || !form.pickupPhone || !form.dropoffAddress || !form.dropoffPhone) {
      return toast.error("Fill all address fields");
    }
    
    // Auto-calculate distance
    setIsCalculatingLoc(true);
    try {
      const p1 = await geocode(form.pickupAddress);
      const p2 = await geocode(form.dropoffAddress);
      
      if (p1 && p2) {
        const dist = getDistance(p1[0], p1[1], p2[0], p2[1]);
        setForm((prev) => ({ ...prev, distance: dist }));
        toast.success(`Auto-calculated distance: ${dist} km`, { icon: '📍' });
      } else {
        toast.error("Could not precisely locate addresses. Please enter distance manually.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculatingLoc(false);
      setStep(2);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-on-surface)" }}>Book Delivery</h1>
        <p style={{ fontSize: 13, color: "var(--color-on-surface-variant)", marginTop: 2 }}>Configure your shipment</p>
      </div>

      {/* Step bar */}
      <div className="glass-panel" style={{ borderRadius: 18, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-outline)",
          background: "rgba(0,0,0,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: 14, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.1)", zIndex: 0 }} />
            <div style={{
              position: "absolute", top: 14, left: 0, height: 2, zIndex: 0,
              background: "var(--color-primary)", transition: "width .4s",
              width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
            }} />
            {stepLabels.map((label, i) => {
              const s = i + 1, done = step > s, active = step === s;
              return (
                <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, zIndex: 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", fontWeight: 800, fontSize: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: done || active ? "var(--color-primary)" : "rgba(13, 17, 30, 0.6)",
                    color: done || active ? "#fff" : "var(--color-on-surface-variant)",
                    border: done || active ? "none" : "2px solid var(--color-outline-variant)",
                    boxShadow: active ? "0 0 0 3px rgba(139, 92, 246, 0.35)" : "none",
                  }}>
                    {done ? <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check</span> : s}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500,
                    color: active ? "var(--color-primary-container)" : "var(--color-on-surface-variant)", display: "none" }}
                    className="sm:block">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Show current step label on mobile */}
          <p style={{ textAlign: "center", marginTop: 10, fontSize: 12, fontWeight: 700,
            color: "var(--color-primary-container)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Step {step}: {stepLabels[step - 1]}
          </p>
        </div>

        {/* ── Step 1: Addresses ── */}
        {step === 1 && (
          <div style={{ padding: "20px", background: "transparent", display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <SectionTitle n="A" title="Pickup Details" />
              <div className="form-grid">
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary-container)", textTransform: "uppercase",
                    letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Pickup Address</label>
                  <div style={{ position: "relative" }}>
                    <span className="material-symbols-outlined" style={{ position: "absolute", left: 12,
                      top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--color-success)" }}>location_on</span>
                    <input id="pickup-address" placeholder="e.g. Mirpur-10, Dhaka" value={form.pickupAddress}
                      onChange={set("pickupAddress")} style={{ paddingLeft: 38 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary-container)", textTransform: "uppercase",
                    letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Sender Phone</label>
                  <input id="pickup-phone" placeholder="017XXXXXXXX" value={form.pickupPhone} onChange={set("pickupPhone")} />
                </div>
              </div>
            </div>

            <div>
              <SectionTitle n="B" title="Drop-off Details" />
              <div className="form-grid">
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary-container)", textTransform: "uppercase",
                    letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Drop-off Address</label>
                  <div style={{ position: "relative" }}>
                    <span className="material-symbols-outlined" style={{ position: "absolute", left: 12,
                      top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--color-primary-container)" }}>location_on</span>
                    <input id="dropoff-address" placeholder="e.g. Gulshan-2, Dhaka" value={form.dropoffAddress}
                      onChange={set("dropoffAddress")} style={{ paddingLeft: 38 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary-container)", textTransform: "uppercase",
                    letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Recipient Phone</label>
                  <input id="dropoff-phone" placeholder="017XXXXXXXX" value={form.dropoffPhone} onChange={set("dropoffPhone")} />
                </div>
              </div>
            </div>

            {/* Live map preview */}
            {showMap && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)", textTransform: "uppercase",
                  letterSpacing: "0.06em", marginBottom: 8 }}>Route Preview</p>
                <DeliveryMap pickup={form.pickupAddress} dropoff={form.dropoffAddress} height="220px" />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
              <button className="btn-primary" style={{ minWidth: 180, position: "relative" }}
                onClick={handleNextStep1} disabled={isCalculatingLoc}>
                {isCalculatingLoc ? "Mapping Route…" : "Next: Parcel Details"}
                {!isCalculatingLoc && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Parcel ── */}
        {step === 2 && (
          <div style={{ padding: "20px", background: "transparent", display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <h3 style={{ fontWeight: 700, color: "var(--color-on-surface)", fontSize: "0.9rem", marginBottom: 12 }}>Parcel Type</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}
                className="sm:grid-cols-4">
                {TYPES.map((t) => (
                  <button key={t.value} onClick={() => setForm({ ...form, parcelType: t.value })}
                    style={{
                      padding: "14px 10px", borderRadius: 12, textAlign: "center",
                      border: `2px solid ${form.parcelType === t.value ? "var(--color-primary)" : "rgba(255,255,255,0.1)"}`,
                      background: form.parcelType === t.value ? "rgba(139, 92, 246, 0.15)" : "rgba(13, 17, 30, 0.6)",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize: 26, color: form.parcelType === t.value ? "var(--color-primary-container)" : "var(--color-on-surface-variant)" }}>
                      {t.icon}
                    </span>
                    <p style={{ fontSize: 12, fontWeight: 600, marginTop: 4,
                      color: form.parcelType === t.value ? "var(--color-primary-container)" : "var(--color-on-surface-variant)" }}>
                      {t.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid">
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary-container)", textTransform: "uppercase",
                  letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Weight (kg)</label>
                <input id="parcel-weight" type="number" step="0.1" min="0.1"
                  placeholder="e.g. 2.5" value={form.weight} onChange={set("weight")} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary-container)", textTransform: "uppercase",
                  letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Distance (km)</label>
                <div style={{ position: "relative" }}>
                  <input id="parcel-distance" type="number" step="0.1" min="0.1"
                    placeholder="e.g. 5" value={form.distance} onChange={set("distance")}
                    style={{ paddingRight: 40 }} />
                  {form.distance && (
                    <span className="material-symbols-outlined" title="Distance auto-calculated from map"
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                        fontSize: 18, color: "var(--color-success)", pointerEvents: "none" }}>
                      verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-primary-container)", textTransform: "uppercase",
                letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Special Notes (Optional)</label>
              <textarea id="parcel-notes" placeholder="Fragile, handle with care…"
                value={form.notes} onChange={set("notes")} rows={3} style={{ resize: "none" }} />
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => setStep(1)} className="btn-outline" style={{ flex: "1 1 120px" }}>Back</button>
              <button onClick={() => {
                if (!form.weight || !form.distance) return toast.error("Enter weight and distance");
                priceMutation.mutate({ distance: +form.distance, weight: +form.weight, parcelType: form.parcelType });
              }} className="btn-primary" style={{ flex: "2 1 160px" }}>
                {priceMutation.isPending ? "Calculating…" : "Get Price Estimate"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && (
          <div style={{ padding: "20px", background: "transparent", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Price hero */}
            <div style={{ textAlign: "center", padding: "20px", borderRadius: 14,
              background: "rgba(0,0,0,0.2)",
              border: "1px solid var(--color-outline)" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)", textTransform: "uppercase",
                letterSpacing: "0.08em" }}>Estimated Price</p>
              {appliedCoupon ? (
                <>
                  <p style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--color-on-surface-variant)", lineHeight: 1,
                    textDecoration: "line-through", marginTop: 6 }}>৳{price}</p>
                  <p style={{ fontSize: "3rem", fontWeight: 800, color: "var(--color-success)", lineHeight: 1.1 }}>৳{finalPrice}</p>
                  <span style={{ display: "inline-block", marginTop: 6, padding: "3px 12px",
                    borderRadius: 999, fontSize: 11, fontWeight: 700,
                    background: "rgba(16,185,129,0.15)", color: "var(--color-success)" }}>
                    You save ৳{savings}!
                  </span>
                </>
              ) : (
                <p style={{ fontSize: "3rem", fontWeight: 800, color: "var(--color-primary-container)", lineHeight: 1.1 }}>৳{price}</p>
              )}
            </div>

            {/* ── Coupon input ── */}
            <div style={{ borderRadius: 12, border: "1px dashed var(--color-outline-variant)", padding: "14px 16px",
              background: appliedCoupon ? "rgba(16,185,129,0.08)" : "rgba(0,0,0,0.15)" }}>
              {appliedCoupon ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="material-symbols-outlined filled" style={{ fontSize: 22, color: "var(--color-success)" }}>check_circle</span>
                    <div>
                      <p style={{ fontWeight: 700, color: "var(--color-success)", fontSize: 13 }}>Coupon applied: {appliedCoupon.code}</p>
                      <p style={{ fontSize: 11, color: "var(--color-on-surface-variant)" }}>
                        {appliedCoupon.discountType === "percentage"
                          ? `${appliedCoupon.discountValue}% off`
                          : `৳${appliedCoupon.discountValue} flat discount`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                    style={{ background: "none", border: "none", color: "var(--color-on-surface-variant)", cursor: "pointer",
                      fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)", textTransform: "uppercase",
                    letterSpacing: "0.06em", marginBottom: 8 }}>Have a coupon code?</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code e.g. SAVE20"
                      style={{ flex: 1, fontSize: 13, fontWeight: 600, letterSpacing: "0.05em",
                        textTransform: "uppercase" }}
                    />
                    <button
                      onClick={() => { if (couponCode.trim()) couponMutation.mutate(couponCode.trim()); }}
                      disabled={!couponCode.trim() || couponMutation.isPending}
                      className="btn-primary"
                      style={{ padding: "0 16px", flexShrink: 0, opacity: !couponCode.trim() ? 0.5 : 1 }}>
                      {couponMutation.isPending ? "…" : "Apply"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Route map */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-on-surface-variant)", textTransform: "uppercase",
                letterSpacing: "0.06em", marginBottom: 8 }}>Route</p>
              <DeliveryMap pickup={form.pickupAddress} dropoff={form.dropoffAddress} height="220px" />
            </div>

            {/* Summary */}
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--color-outline)", background: "rgba(0,0,0,0.15)" }}>
              {[
                ["From",     form.pickupAddress],
                ["To",       form.dropoffAddress],
                ["Type",     form.parcelType],
                ["Weight",   `${form.weight} kg`],
                ["Distance", `${form.distance} km`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 16px", borderBottom: "1px solid var(--color-outline)" }}>
                  <span style={{ fontSize: 13, color: "var(--color-on-surface-variant)" }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-on-surface)",
                    textTransform: "capitalize", maxWidth: "55%", textAlign: "right",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => setStep(2)} className="btn-outline" style={{ flex: "1 1 120px" }}>Back</button>
              <button id="confirm-booking" onClick={() => orderMutation.mutate({
                  ...form,
                  weight: +form.weight,
                  distance: +form.distance,
                  price: finalPrice,
                  couponCode: appliedCoupon?.code || null,
                })}
                disabled={orderMutation.isPending}
                style={{
                  flex: "2 1 160px", padding: "12px", borderRadius: 8, border: "none",
                  background: "var(--color-success)", color: "#fff", fontWeight: 700, fontSize: "0.9rem",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxShadow: "0 4px 14px rgba(16,185,129,0.3)", opacity: orderMutation.isPending ? 0.6 : 1,
                  transition: "all 0.18s"
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
                {orderMutation.isPending ? "Booking…" : `Confirm Booking · ৳${finalPrice}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookParcel;
