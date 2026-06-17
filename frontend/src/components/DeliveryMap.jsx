import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const geocodeCache = {};
const geocode = async (address) => {
  if (geocodeCache[address]) return geocodeCache[address];
  try {
    const q = encodeURIComponent(`${address}, Bangladesh`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`,
      { headers: { "User-Agent": "QuickDrop/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      const result = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      geocodeCache[address] = result;
      return result;
    }
  } catch {}
  const fallback = [23.8103 + (Math.random() - 0.5) * 0.05, 90.4125 + (Math.random() - 0.5) * 0.05];
  geocodeCache[address] = fallback;
  return fallback;
};

const FitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (!positions.length) return;
    if (positions.length === 1) { map.setView(positions[0], 14); return; }
    map.fitBounds(positions, { padding: [40, 40] });
  }, [map, positions]);
  return null;
};

/* ── Invalidate map size when fullscreen toggled ── */
const InvalidateSize = () => {
  const map = useMap();
  useEffect(() => { setTimeout(() => map.invalidateSize(), 100); }, [map]);
  return null;
};

/* ── The actual map content (shared between inline & fullscreen) ── */
const MapContent = ({ pickupPos, dropoffPos, pickup, dropoff, positions }) => (
  <>
    <TileLayer
      attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    <FitBounds positions={positions} />
    <InvalidateSize />
    {pickupPos && (
      <Marker position={pickupPos} icon={greenIcon}>
        <Popup><strong>📦 Pickup</strong><br />{pickup}</Popup>
      </Marker>
    )}
    {dropoffPos && (
      <Marker position={dropoffPos} icon={redIcon}>
        <Popup><strong>📍 Drop-off</strong><br />{dropoff}</Popup>
      </Marker>
    )}
    {pickupPos && dropoffPos && (
      <Polyline positions={[pickupPos, dropoffPos]}
        pathOptions={{ color: "var(--color-primary)", weight: 3, dashArray: "6 6", opacity: 0.75 }} />
    )}
  </>
);

/**
 * DeliveryMap
 * Props: pickup, dropoff, height, single
 * Bottom-right corner button expands to fullscreen overlay.
 */
const DeliveryMap = ({ pickup, dropoff, height = "260px", single = false }) => {
  const [pickupPos,  setPickupPos]  = useState(null);
  const [dropoffPos, setDropoffPos] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPickupPos(null);
    setDropoffPos(null);
    const load = async () => {
      const p = pickup  ? await geocode(pickup)  : null;
      const d = (!single && dropoff) ? await geocode(dropoff) : null;
      setPickupPos(p);
      setDropoffPos(d);
      setLoading(false);
    };
    load();
  }, [pickup, dropoff, single]);

  // Close fullscreen on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const positions = [pickupPos, dropoffPos].filter(Boolean);
  const center    = pickupPos || [23.8103, 90.4125];

  const expandBtn = (fs) => (
    <button
      onClick={() => setFullscreen(!fs)}
      title={fs ? "Exit fullscreen (Esc)" : "Expand to fullscreen"}
      style={{
        position: "absolute", bottom: 10, right: 10, zIndex: 1000,
        width: 32, height: 32, borderRadius: 6,
        background: "rgba(15, 23, 42, 0.85)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all .15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "#8b5cf6";
        const icon = e.currentTarget.querySelector("span");
        if (icon) icon.style.color = "#fff";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "rgba(15, 23, 42, 0.85)";
        const icon = e.currentTarget.querySelector("span");
        if (icon) icon.style.color = "var(--color-on-surface)";
      }}
    >
      <span className="material-symbols-outlined"
        style={{ fontSize: 17, color: "var(--color-on-surface)", pointerEvents: "none", transition: "color .15s" }}>
        {fs ? "fullscreen_exit" : "fullscreen"}
      </span>
    </button>
  );

  /* ── Loading state ── */
  if (loading) return (
    <div className="glass-panel" style={{ height, borderRadius: 12,
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 8 }}>
      <div className="animate-spin" style={{ width: 18, height: 18, borderRadius: "50%",
        border: "2.5px solid rgba(255,255,255,0.1)", borderTopColor: "var(--color-primary)" }} />
      <span style={{ fontSize: 13, color: "var(--color-on-surface-variant)" }}>Loading map…</span>
    </div>
  );

  return (
    <>
      {/* ── Inline map ── */}
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden",
        border: "1px solid rgba(255, 255, 255, 0.08)", height }}>
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <MapContent pickupPos={pickupPos} dropoffPos={dropoffPos}
            pickup={pickup} dropoff={dropoff} positions={positions} />
        </MapContainer>
        {expandBtn(false)}
      </div>

      {/* ── Fullscreen overlay ── */}
      {fullscreen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setFullscreen(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(9, 13, 22, 0.8)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
            animation: "fade-in 0.2s ease-out",
          }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: 960, height: "85vh", borderRadius: 16,
            overflow: "hidden", position: "relative",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>

            {/* Address legend */}
            <div style={{
              position: "absolute", top: 12, left: 12, zIndex: 1000,
              background: "rgba(15, 23, 42, 0.9)", borderRadius: 10, padding: "10px 14px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              maxWidth: "calc(100% - 100px)",
            }}>
              {pickup && (
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: dropoff ? 6 : 0 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--color-on-surface)", fontWeight: 600 }}>{pickup}</span>
                </div>
              )}
              {dropoff && (
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--color-on-surface-variant)" }}>{dropoff}</span>
                </div>
              )}
            </div>

            <MapContainer center={center} zoom={13}
              style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
              <MapContent pickupPos={pickupPos} dropoffPos={dropoffPos}
                pickup={pickup} dropoff={dropoff} positions={positions} />
            </MapContainer>

            {/* Fullscreen close button */}
            {expandBtn(true)}

            {/* ESC hint */}
            <div style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
              background: "rgba(15, 23, 42, 0.8)", color: "#fff", borderRadius: 999,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "4px 12px", fontSize: 11, zIndex: 1000, pointerEvents: "none",
            }}>
              Press <kbd style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: 3 }}>Esc</kbd> or click outside to close
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeliveryMap;
