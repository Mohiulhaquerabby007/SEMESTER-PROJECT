import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../services/api";

const vehicleIcon  = { bike: "🏍️", car: "🚗", van: "🚐" };

const ManageRiders = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRider, setNewRider] = useState({ name: "", email: "", phone: "", password: "", vehicleType: "bike" });

  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(window._riderSearchTimer);
    window._riderSearchTimer = setTimeout(() => setDebouncedSearch(v), 350);
  };

  const { data: riders = [], isLoading } = useQuery({
    queryKey: ["adminRiders", debouncedSearch],
    queryFn: () =>
      api.get(`/admin/riders${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ""}`)
         .then((r) => r.data),
  });

  const blockMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/riders/${id}/block`),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ["adminRiders"] });
    },
    onError: () => toast.error("Action failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/riders/${id}`),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries({ queryKey: ["adminRiders"] });
    },
    onError: () => toast.error("Failed to delete rider"),
  });

  const addMutation = useMutation({
    mutationFn: (d) => api.post(`/admin/riders`, d),
    onSuccess: () => {
      toast.success("Rider added successfully");
      setIsAddModalOpen(false);
      setNewRider({ name: "", email: "", phone: "", password: "", vehicleType: "bike" });
      queryClient.invalidateQueries({ queryKey: ["adminRiders"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to add rider"),
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newRider.name || !newRider.email || !newRider.phone || !newRider.password) {
      return toast.error("Please fill all fields");
    }
    addMutation.mutate(newRider);
  };

  const maxDeliveries = Math.max(...riders.map((r) => r.completedDeliveries || 0), 1);

  return (
    <div className="page-container animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#181c1e" }}>Manage Riders</h1>
          <p style={{ fontSize: 13, color: "#7a7484", marginTop: 2 }}>{riders.length} delivery partners</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary" style={{ padding: "8px 16px", borderRadius: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span> Add Rider
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <span className="material-symbols-outlined"
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 20, color: "#7a7484" }}>
          search
        </span>
        <input placeholder="Search by name or phone…"
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
      ) : riders.length === 0 ? (
        <div className="glass-panel" style={{ borderRadius: 18, textAlign: "center", padding: "60px 20px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#cbc3d5" }}>
            delivery_dining
          </span>
          <p style={{ marginTop: 12, fontWeight: 700, color: "#181c1e", fontSize: "1.1rem" }}>No riders found</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {riders.map((r) => {
            const pct = Math.round((r.completedDeliveries / maxDeliveries) * 100);
            return (
              <div key={r._id} className="glass-panel" style={{ 
                  borderRadius: 18, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(107,70,193,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.05)"; }}>
                
                <div style={{ padding: "18px 20px", flex: 1, position: "relative" }}>
                  {/* Top Right Badges */}
                  <div style={{ position: "absolute", top: 18, right: 20, display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999,
                      background: r.isAvailable ? "rgba(21,128,61,0.1)" : "rgba(180,83,9,0.1)",
                      color: r.isAvailable ? "#15803D" : "#B45309" }}>
                      {r.isAvailable ? "Available" : "On Delivery"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {/* Avatar */}
                    <div style={{ position: "relative" }}>
                      <div style={{ width: 50, height: 50, borderRadius: "50%", background: r.isBlocked ? "#9CA3AF" : "#6b46c1",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, overflow: "hidden" }}>
                        {r.profilePic ? (
                          <img src={r.profilePic} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", filter: r.isBlocked ? "grayscale(100%)" : "none" }} />
                        ) : (
                          r.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div style={{ position: "absolute", bottom: -4, right: -4, background: "#fff", borderRadius: "50%", padding: 2, display: "flex" }}>
                        <span style={{ fontSize: 14, background: "#f3f4f6", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {vehicleIcon[r.vehicleType]}
                        </span>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 60 }}>
                      <p style={{ fontWeight: 800, fontSize: 15, color: "#181c1e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.name}
                      </p>
                      <p style={{ fontSize: 12, color: "#7a7484", marginTop: 2 }}>{r.phone}</p>
                    </div>
                  </div>

                  {/* Stats & Progress */}
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 }}>
                      <div>
                        <p style={{ fontSize: 11, color: "#7a7484", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Deliveries</p>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "#181c1e" }}>{r.completedDeliveries}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 11, color: "#7a7484", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Earnings</p>
                        <p style={{ fontSize: 15, fontWeight: 800, color: "#15803D" }}>৳{r.totalEarnings.toLocaleString()}</p>
                      </div>
                    </div>
                    <div style={{ height: 6, background: "rgba(107,70,193,0.1)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#6b46c1", borderRadius: 999, width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ background: "rgba(107,70,193,0.03)", padding: "12px 20px", borderTop: "1px solid rgba(255,255,255,0.4)", display: "flex", gap: 10 }}>
                  <button onClick={() => blockMutation.mutate(r._id)} disabled={blockMutation.isPending}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none",
                      background: r.isBlocked ? "#15803D" : "#dc2626", color: "#fff", transition: "opacity 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 0.85}
                    onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                    {r.isBlocked ? "Unblock" : "Block"}
                  </button>
                  
                  <button onClick={() => { if(window.confirm("Delete this rider?")) deleteMutation.mutate(r._id); }} disabled={deleteMutation.isPending}
                    style={{
                      width: 36, height: 36, borderRadius: 8, cursor: "pointer", border: "none",
                      background: "rgba(220,38,38,0.1)", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(220,38,38,0.1)"; e.currentTarget.style.color = "#dc2626"; }}
                    title="Delete Rider">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add Rider Modal */}
      {isAddModalOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: "100%", maxWidth: 400, borderRadius: 20, overflow: "hidden", padding: 0 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#181c1e" }}>Add Rider</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#7a7484" }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b46c1", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Full Name</label>
                <input placeholder="Rider Name" value={newRider.name} onChange={e => setNewRider({...newRider, name: e.target.value})} style={{ width: "100%" }} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b46c1", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email</label>
                <input type="email" placeholder="rider@quickdrop.com" value={newRider.email} onChange={e => setNewRider({...newRider, email: e.target.value})} style={{ width: "100%" }} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b46c1", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Phone</label>
                <input placeholder="017XXXXXXXX" value={newRider.phone} onChange={e => setNewRider({...newRider, phone: e.target.value})} style={{ width: "100%" }} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b46c1", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
                <input type="password" placeholder="Min 6 characters" value={newRider.password} onChange={e => setNewRider({...newRider, password: e.target.value})} style={{ width: "100%" }} required />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#6b46c1", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Vehicle Type</label>
                <select value={newRider.vehicleType} onChange={e => setNewRider({...newRider, vehicleType: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid #cbc3d5" }}>
                  <option value="bike">Bike 🏍️</option>
                  <option value="car">Car 🚗</option>
                  <option value="van">Van 🚐</option>
                </select>
              </div>
              
              <button type="submit" disabled={addMutation.isPending} className="btn-primary" style={{ marginTop: 10, width: "100%" }}>
                {addMutation.isPending ? "Adding..." : "Add Delivery Partner"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRiders;
