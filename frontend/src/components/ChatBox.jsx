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
  });

  useEffect(() => {
    import("../services/socket").then(({ default: socket }) => {
      socket.emit("join_order_room", orderId);
      
      const handleMessage = (msg) => {
        // If it's not our own message, show a toast
        if (msg.senderId !== user._id) {
          toast.success("New message received", { icon: "💬" });
        }
        queryClient.invalidateQueries({ queryKey: ["chat", orderId] });
      };

      socket.on("receive_message", handleMessage);

      return () => {
        socket.off("receive_message", handleMessage);
      };
    });
  }, [orderId, queryClient, user._id]);

  const sendMutation = useMutation({
    mutationFn: async (msgText) => {
      // Optimistically emit via socket for fast delivery, and also save via API
      const { default: socket } = await import("../services/socket");
      socket.emit("send_message", {
        orderId,
        senderId: user._id,
        senderModel: user.accountType === "rider" ? "Rider" : "User",
        text: msgText
      });
      return api.post(`/chat/${orderId}`, { text: msgText });
    },
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["chat", orderId] });
    },
    onError: () => toast.error("Failed to send message")
  });

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
    <div className="glass-panel" style={{ display: "flex", flexDirection: "column", height: 400, borderRadius: 18, overflow: "hidden" }}>
      <div style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", padding: "14px 20px", color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
        <span className="material-symbols-outlined">chat</span>
        <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Order Chat</h3>
      </div>
      
      <div ref={scrollRef} style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
            <span className="animate-spin material-symbols-outlined" style={{ color: "var(--color-primary-container)" }}>sync</span>
          </div>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--color-on-surface-variant)", fontSize: 13, marginTop: 40 }}>Send a message to start the conversation.</p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender === user._id;
            return (
              <div key={m._id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", maxWidth: "85%", alignSelf: isMe ? "flex-end" : "flex-start" }}>
                <div style={{
                  padding: "10px 14px", borderRadius: 16, fontSize: 14,
                  background: isMe ? "linear-gradient(135deg, #8b5cf6, #6d28d9)" : "rgba(15, 23, 42, 0.6)",
                  color: "#fff",
                  borderBottomRightRadius: isMe ? 4 : 16,
                  borderBottomLeftRadius: isMe ? 16 : 4,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  border: isMe ? "none" : "1px solid rgba(255, 255, 255, 0.08)"
                }}>
                  {m.text}
                </div>
                <span style={{ fontSize: 10, color: "var(--color-on-surface-variant)", marginTop: 4, marginLeft: 4, marginRight: 4 }}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} style={{ display: "flex", padding: 12, background: "rgba(11, 15, 25, 0.6)", borderTop: "1px solid rgba(255,255,255,0.08)", gap: 10 }}>
        <input 
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: "10px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", fontSize: 14, outline: "none", background: "rgba(15, 23, 42, 0.65)", color: "#fff" }}
        />
        <button type="submit" disabled={!text.trim() || sendMutation.isPending} style={{
          width: 42, height: 42, borderRadius: "50%", background: text.trim() ? "linear-gradient(135deg, #8b5cf6, #3b82f6)" : "rgba(255, 255, 255, 0.05)", color: text.trim() ? "#fff" : "rgba(255, 255, 255, 0.3)", border: "none", cursor: text.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
