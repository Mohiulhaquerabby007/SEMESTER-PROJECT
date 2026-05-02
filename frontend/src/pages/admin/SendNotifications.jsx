import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../../services/api";

const SendNotifications = () => {
  const [formData, setFormData] = useState({
    targetType: "all",
    title: "",
    body: "",
  });

  const sendMutation = useMutation({
    mutationFn: (data) => api.post("/notifications/send", data),
    onSuccess: (data) => {
      toast.success(`Sent! Success: ${data.data.successCount}, Failed: ${data.data.failureCount}`);
      setFormData({ ...formData, title: "", body: "" });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to send notifications");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error("Title and body are required");
      return;
    }
    sendMutation.mutate(formData);
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#181c1e] tracking-tight">Push Notifications</h1>
        <p className="text-[#7a7484] mt-1">Send custom alerts to users and riders</p>
      </div>

      <div className="glass-card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-[#494453]">Target Audience</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[{ id: "all", label: "Everyone", icon: "public" }, 
                { id: "users", label: "All Customers", icon: "group" }, 
                { id: "riders", label: "All Delivery Partners", icon: "delivery_dining" }
              ].map((target) => (
                <div 
                  key={target.id}
                  onClick={() => setFormData({ ...formData, targetType: target.id })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                    formData.targetType === target.id 
                      ? "border-[#6b46c1] bg-[rgba(107,70,193,0.05)] text-[#6b46c1]" 
                      : "border-transparent bg-white shadow-sm hover:border-gray-200 text-[#494453]"
                  }`}
                >
                  <span className="material-symbols-outlined">{target.icon}</span>
                  <span className="font-bold">{target.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-[#494453]">Notification Title</label>
            <input 
              required
              maxLength={65}
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder="e.g. 🚀 Special Weekend Discount!" 
              className="w-full p-4 rounded-xl border border-gray-200 bg-white/70 focus:bg-white focus:ring-2 focus:ring-[#6b46c1]/20 outline-none transition-all text-lg font-semibold" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-[#494453]">Notification Message</label>
            <textarea 
              required
              rows={4}
              maxLength={240}
              value={formData.body} 
              onChange={e => setFormData({...formData, body: e.target.value})} 
              placeholder="Type your message here..." 
              className="w-full p-4 rounded-xl border border-gray-200 bg-white/70 focus:bg-white focus:ring-2 focus:ring-[#6b46c1]/20 outline-none transition-all resize-none" 
            />
            <div className="text-right text-xs text-[#7a7484] mt-1">{formData.body.length}/240</div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm items-start">
            <span className="material-symbols-outlined text-amber-500 shrink-0">info</span>
            <p><strong>Note:</strong> Push notifications will only be delivered to devices that have installed the app, granted notification permissions, and have an active Firebase connection. (Ensure Firebase Admin is configured in `backend/server.js`)</p>
          </div>

          <button 
            type="submit" 
            disabled={sendMutation.isPending} 
            className="btn-primary py-4 text-lg justify-center mt-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            {sendMutation.isPending ? (
              <><span className="animate-spin material-symbols-outlined">sync</span> Sending...</>
            ) : (
              <><span className="material-symbols-outlined">send</span> Send Push Notification</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SendNotifications;
