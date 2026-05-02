import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from "react-hot-toast";

const ChatBox = ({ orderId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const scrollRef = useRef();
  const prevMessagesLength = useRef(0);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chat", orderId],
    queryFn: () => api.get(`/chat/${orderId}`).then((r) => r.data),
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const sendMutation = useMutation({
    mutationFn: (msg) => api.post(`/chat/${orderId}`, { text: msg }),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["chat", orderId] });
      toast.success("Message sent", { icon: "💬" });
    },
    onError: () => {
      toast.error("Failed to send message");
    }
  });

  // Notifications for new received messages
  useEffect(() => {
    if (messages.length > prevMessagesLength.current && prevMessagesLength.current > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender !== user._id) {
        toast.success("New message received", { icon: "💬" });
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, user._id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendMutation.mutate(text);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 400, background: "rgba(255,255,255,0.6)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.4)", overflow: "hidden" }}>
      <div style={{ background: "linear-gradient(135deg, #6b46c1, #532aa8)", padding: "14px 20px", color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
        <span className="material-symbols-outlined">chat</span>
        <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Order Chat</h3>
      </div>
      
      <div ref={scrollRef} style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
            <span className="animate-spin material-symbols-outlined" style={{ color: "#6b46c1" }}>sync</span>
          </div>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: "center", color: "#7a7484", fontSize: 13, marginTop: 40 }}>Send a message to start the conversation.</p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender === user._id;
            return (
              <div key={m._id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "85%", alignSelf: isMe ? "flex-end" : "flex-start" }}>
                <div style={{
                  padding: "10px 14px", borderRadius: 16, fontSize: 14,
                  background: isMe ? "#6b46c1" : "#fff",
                  color: isMe ? "#fff" : "#181c1e",
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius: isMe ? 16 : 4,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  border: isMe ? "none" : "1px solid rgba(107,70,193,0.15)"
                }}>
                  {m.text}
                </div>
                <span style={{ fontSize: 10, color: "#7a7484", marginTop: 4, marginLeft: 4, marginRight: 4 }}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", padding: 12, background: "rgba(255,255,255,0.8)", borderTop: "1px solid rgba(255,255,255,0.4)", gap: 10 }}>
        <input 
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: "10px 16px", borderRadius: 999, border: "1px solid rgba(107,70,193,0.2)", fontSize: 14, outline: "none", background: "rgba(255,255,255,0.5)" }}
        />
        <button type="submit" disabled={!text.trim() || sendMutation.isPending} style={{
          width: 42, height: 42, borderRadius: "50%", background: text.trim() ? "#6b46c1" : "#cbc3d5", color: "#fff", border: "none", cursor: text.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
