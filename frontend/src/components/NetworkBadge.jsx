import { useState, useEffect } from "react";
import { Network } from "@capacitor/network";

const NetworkBadge = () => {
  const [online, setOnline] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      const status = await Network.getStatus();
      setOnline(status.connected);
      if (!status.connected) setVisible(true);
    };
    init();
    const listener = Network.addListener("networkStatusChange", (s) => {
      setOnline(s.connected);
      setVisible(true);
      if (s.connected) setTimeout(() => setVisible(false), 2500);
    });
    return () => listener.then((h) => h.remove()).catch(() => {});
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 rounded-full shadow-lg animate-fade-in"
      style={{
        background: online ? "rgba(16, 185, 129, 0.9)" : "rgba(239, 68, 68, 0.9)",
        color: "#fff",
        fontSize: "13px",
        fontWeight: 600,
        backdropFilter: "blur(12px)",
        border: online ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
        {online ? "wifi" : "wifi_off"}
      </span>
      {online ? "Back online" : "No internet connection"}
    </div>
  );
};

export default NetworkBadge;
