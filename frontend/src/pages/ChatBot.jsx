import { useState, useRef, useEffect } from "react";
import "./ChatBot.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "👋 Hi! I'm your cyber lab AI assistant. Ask me anything about labs, hacking, or cybersecurity!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { from: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setMessages(prev => [...prev, { from: "bot", text: "Please log in to use the AI assistant." }]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { from: "bot", text: data.reply || "Sorry, try again." }]);
    } catch {
      setMessages(prev => [...prev, { from: "bot", text: "Error connecting to AI." }]);
    }
    setLoading(false);
  };

  return (
    <>
      {!open && <button className="chatbot-fab" onClick={() => setOpen(true)}>💬</button>}
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header"><span>🤖 AI Assistant</span><button onClick={() => setOpen(false)}>✕</button></div>
          <div className="chatbot-body" ref={chatRef}>
            {messages.map((m, i) => <div key={i} className={`chat-msg ${m.from}`}>{m.text}</div>)}
            {loading && <div className="chat-msg bot">Thinking...</div>}
          </div>
          <div className="chatbot-input">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Ask anything..." disabled={loading} />
            <button onClick={handleSend} disabled={loading}>➤</button>
          </div>
        </div>
      )}
    </>
  );
          }
