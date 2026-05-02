import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../services/api";

const ManageUsers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(window._userSearchTimer);
    window._userSearchTimer = setTimeout(() => setDebouncedSearch(v), 350);
  };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["adminUsers", debouncedSearch],
    queryFn: () =>
      api.get(`/admin/users${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ""}`)
         .then((r) => r.data),
  });

  const blockMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/users/${id}/block`),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: () => toast.error("Action failed"),
  });

  return (
    <div className="page-container animate-fade-in">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#181c1e" }}>
          Manage Users
        </h1>
        <p style={{ fontSize: 13, color: "#7a7484", marginTop: 2 }}>
          {users.length} registered customers
        </p>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <span className="material-symbols-outlined"
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 20, color: "#7a7484" }}>
          search
        </span>
        <input placeholder="Search by name, email or phone…"
          value={search} onChange={(e) => handleSearch(e.target.value)}
          style={{ width: "100%", padding: "12px 14px 12px 42px", borderRadius: 12, border: "1px solid rgba(107,70,193,0.2)",
            background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", fontSize: 14, color: "#181c1e",
            boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }} />
        {search && (
          <button onClick={() => { setSearch(""); setDebouncedSearch(""); }}
            style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#7a7484", display: "flex", alignItems: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: "50%",
            border: "3px solid #d0c0e4", borderTopColor: "#6b46c1" }} />
        </div>
      ) : users.length === 0 ? (
        <div className="glass-panel" style={{ borderRadius: 18, textAlign: "center", padding: "60px 20px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#cbc3d5" }}>
            person_search
          </span>
          <p style={{ marginTop: 12, fontWeight: 700, color: "#181c1e", fontSize: "1.1rem" }}>No users found</p>
          <p style={{ fontSize: 13, color: "#7a7484", marginTop: 4 }}>Try a different search term</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {users.map((u) => (
            <div key={u._id} className="glass-panel" style={{ 
                borderRadius: 18, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(107,70,193,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.05)"; }}>
              
              <div style={{ padding: "18px 20px", flex: 1, position: "relative" }}>
                {/* Badges */}
                {u.isBlocked && (
                  <div style={{ position: "absolute", top: 18, right: 20 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: "#dc2626", color: "#fff" }}>
                      Blocked
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  {/* Avatar */}
                  <div style={{ width: 50, height: 50, borderRadius: "50%", background: u.isBlocked ? "#9CA3AF" : "#0369A1",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0, overflow: "hidden" }}>
                    {u.profilePic ? (
                      <img src={u.profilePic} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", filter: u.isBlocked ? "grayscale(100%)" : "none" }} />
                    ) : (
                      u.name.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  {/* Basic Info */}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: u.isBlocked ? 60 : 0 }}>
                    <p style={{ fontWeight: 800, fontSize: 15, color: "#181c1e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {u.name}
                    </p>
                    <p style={{ fontSize: 12, color: "#7a7484", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</p>
                  </div>
                </div>

                {/* Contact & Orders */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "rgba(255,255,255,0.4)", padding: "12px", borderRadius: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#6b46c1" }}>call</span>
                    <span style={{ fontSize: 12, color: "#494453", fontWeight: 600 }}>{u.phone}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#6b46c1", marginTop: 1 }}>home</span>
                    <span style={{ fontSize: 12, color: "#494453", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {u.address || "No address provided"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: "#6b46c1" }}>package_2</span>
                    <span style={{ fontSize: 12, color: "#494453", fontWeight: 700 }}>{u.orderCount ?? 0} total orders</span>
                  </div>
                </div>
              </div>

              {/* Footer Action */}
              <div style={{ background: "rgba(107,70,193,0.03)", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.4)" }}>
                <button onClick={(e) => { e.stopPropagation(); blockMutation.mutate(u._id); }} disabled={blockMutation.isPending}
                  style={{
                    width: "100%", padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none",
                    background: u.isBlocked ? "#15803D" : "#dc2626", color: "#fff", transition: "opacity 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 0.85}
                  onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                  {u.isBlocked ? "Unblock User" : "Block User"}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
