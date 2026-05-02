import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../../services/api";

const ManageCoupons = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    maxUses: 1,
    expiryDate: "",
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: () => api.get("/coupons").then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/coupons", data),
    onSuccess: () => {
      toast.success("Coupon created successfully");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setShowModal(false);
      setFormData({ code: "", discountType: "percentage", discountValue: "", maxUses: 1, expiryDate: "" });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to create coupon");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/coupons/${id}`),
    onSuccess: () => {
      toast.success("Coupon deleted");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#181c1e] tracking-tight">Manage Coupons</h1>
          <p className="text-[#7a7484] mt-1">Create and monitor discount codes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary px-6">
          <span className="material-symbols-outlined">add</span> Create Coupon
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12"><span className="animate-spin material-symbols-outlined text-[#6b46c1] text-4xl">sync</span></div>
        ) : coupons.length === 0 ? (
          <div className="text-center p-12 text-[#7a7484]">No coupons found. Create one above!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[rgba(107,70,193,0.05)] border-b border-[rgba(255,255,255,0.5)]">
                  <th className="p-4 font-semibold text-[#494453]">Code</th>
                  <th className="p-4 font-semibold text-[#494453]">Discount</th>
                  <th className="p-4 font-semibold text-[#494453]">Uses</th>
                  <th className="p-4 font-semibold text-[#494453]">Expiry Date</th>
                  <th className="p-4 font-semibold text-[#494453]">Status</th>
                  <th className="p-4 font-semibold text-[#494453] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="border-b border-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,255,255,0.6)] transition-colors">
                    <td className="p-4 font-bold text-[#6b46c1]">{coupon.code}</td>
                    <td className="p-4">{coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `৳${coupon.discountValue}`}</td>
                    <td className="p-4">{coupon.usedCount} / {coupon.maxUses === 0 ? "∞" : coupon.maxUses}</td>
                    <td className="p-4">{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      {coupon.isActive && new Date(coupon.expiryDate) >= new Date() ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Active</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Expired/Inactive</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => deleteMutation.mutate(coupon._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">New Coupon</h2>
              <button onClick={() => setShowModal(false)} className="text-[#7a7484] hover:text-[#181c1e]"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Coupon Code</label>
                <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="e.g. SUMMER20" className="w-full p-3 rounded-xl border border-gray-200 uppercase" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1">Type</label>
                  <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 bg-white">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (৳)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1">Value</label>
                  <input required type="number" min="1" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} placeholder="e.g. 20" className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1">Max Uses (0 = ∞)</label>
                  <input required type="number" min="0" value={formData.maxUses} onChange={e => setFormData({...formData, maxUses: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-1">Expiry Date</label>
                  <input required type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
              </div>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary mt-4 py-3 justify-center">
                {createMutation.isPending ? "Creating..." : "Create Coupon"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoupons;
