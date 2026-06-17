const colors = {
  pending:    { bg: "rgba(245, 158, 11, 0.12)", text: "#f59e0b", border: "rgba(245, 158, 11, 0.2)" },
  accepted:   { bg: "rgba(139, 92, 246, 0.12)", text: "#a78bfa", border: "rgba(139, 92, 246, 0.2)" },
  picked_up:  { bg: "rgba(59, 130, 246, 0.12)", text: "#60a5fa", border: "rgba(59, 130, 246, 0.2)" },
  in_transit: { bg: "rgba(6, 182, 212, 0.12)", text: "#22d3ee", border: "rgba(6, 182, 212, 0.2)" },
  delivered:  { bg: "rgba(16, 185, 129, 0.12)", text: "#34d399", border: "rgba(16, 185, 129, 0.2)" },
  cancelled:  { bg: "rgba(239, 68, 68, 0.12)", text: "#f87171", border: "rgba(239, 68, 68, 0.2)" },
};

const labels = {
  pending: "Pending",
  accepted: "Accepted",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const StatusBadge = ({ status }) => {
  const c = colors[status] || { bg: "rgba(255, 255, 255, 0.05)", text: "var(--color-on-surface-variant)", border: "rgba(255, 255, 255, 0.1)" };
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {labels[status] || status}
    </span>
  );
};

export default StatusBadge;
