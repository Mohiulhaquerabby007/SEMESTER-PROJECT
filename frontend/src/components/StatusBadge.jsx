const colors = {
  pending:    { bg: "#FFF8E1", text: "#B45309", border: "#FDE68A" },
  accepted:   { bg: "#EDE9FE", text: "#6b46c1", border: "#DDD6FE" },
  picked_up:  { bg: "#E0F2FE", text: "#0369A1", border: "#BAE6FD" },
  in_transit: { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
  delivered:  { bg: "#F0FDF4", text: "#15803D", border: "#86EFAC" },
  cancelled:  { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
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
  const c = colors[status] || { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };
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
