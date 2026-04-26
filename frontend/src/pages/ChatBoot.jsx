import { useState, useRef, useEffect } from "react";
import "./ChatBot.css";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "👋 Hi! I'm your cyber lab assistant. Ask me anything about the labs, commands, or hacking concepts!" }
  ]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const responses = {
    "scan": "Use: scan <target> — Try 'scan 192.168.1.100' in the Network Recon lab.",
    "nmap": "The scan command simulates Nmap. Use -sV for version detection!",
    "brute force": "In the Brute Force lab, use: brute --target 10.0.0.5 --user admin --wordlist common",
    "xss": "XSS labs use: xss --payload '<script>alert(1)</script>' — but watch out for WAF!",
    "flag": "Flags are hidden in lab outputs. Format: FLAG{...}",
    "help": "Try these labs: Network Recon, Brute Force, XSS, SQL Injection, OSINT, Crypto.",
    "points": "Earn points by completing labs. Check the Dashboard!",
    "leaderboard": "Compete on the Leaderboard! Top operators get 🥇🥈🥉",
    "default": "I can help with lab commands! Try asking about: scan, nmap, brute force, xss, flag, points."
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { from: "user", text: userMsg }]);
    setInput("");

    const lower = userMsg.toLowerCase();
    let reply = responses["default"];
    for (const [key, val] of Object.entries(responses)) {
      if (lower.includes(key)) { reply = val; break; }
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { from: "bot", text: reply }]);
    }, 600);
  };

  return (
    <>
      {!open && (
        <button className="chatbot-fab" onClick={() => setOpen(true)}>
          💬
        </button>
      )}

      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>🤖 Cyber Assistant</span>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chatbot-body" ref={chatRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="chatbot-input">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Ask me something..."
            />
            <button onClick={handleSend}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
