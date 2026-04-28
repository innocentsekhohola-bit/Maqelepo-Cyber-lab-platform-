import { useState, useRef, useEffect } from "react";
import "./ChatBot.css";

const responses = {
  "hello": "Hey there! Ready to hack? 🔥",
  "hi": "Hello operator! What lab are you working on?",
  "how are you": "I'm fully operational! Ready to assist with your labs.",
  "scan": "Use: scan <target_ip> — Try 'scan 192.168.1.100' with -sV for version detection.",
  "nmap": "The scan command simulates Nmap. Flags: -sV (version), -p (port range), -A (aggressive).",
  "brute": "Brute force syntax: brute --target <ip> --user <user> --wordlist <list>",
  "xss": "XSS labs use: xss --payload '<img src=x onerror=alert(1)>' — WAF blocks script tags!",
  "sql": "SQL injection: xss --payload \"admin' OR '1'='1\" — bypasses login forms.",
  "hash": "Crack MD5: brute --hash <hash> --wordlist common",
  "flag": "Flags look like: FLAG{...} — found in lab outputs after completing objectives.",
  "points": "Complete labs to earn points! Check the Dashboard and Leaderboard.",
  "team": "Join or create a Team from the Teams page. Challenge other teams to lab races!",
  "lab": "We have 6 labs: Network Recon, Brute Force, XSS, SQL Injection, OSINT, and Crypto.",
  "help": "I can help with: scan, nmap, brute, xss, sql, hash, flag, points, team, lab.",
  "bye": "Good luck, operator! Come back with flags! 🏆",
  "thanks": "You're welcome! Now go crack some hashes! 💪",
  "thank": "Happy hacking! 🚀"
};

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "👋 Hi! I'm your cyber lab assistant. Ask me about labs, commands, or hacking concepts!" }
  ]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const getReply = (msg) => {
    const lower = msg.toLowerCase();
    for (const [key, val] of Object.entries(responses)) {
      if (lower.includes(key)) return val;
    }
    return "I'm not sure about that. Try asking about: scan, brute, xss, sql, hash, flag, points, team, or lab.";
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { from: "user", text: userMsg }]);
    setInput("");
    
    setTimeout(() => {
      setMessages(prev => [...prev, { from: "bot", text: getReply(userMsg) }]);
    }, 400);
  };

  return (
    <>
      {!open && <button className="chatbot-fab" onClick={() => setOpen(true)}>💬</button>}
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header"><span>🤖 Cyber Assistant</span><button onClick={() => setOpen(false)}>✕</button></div>
          <div className="chatbot-body" ref={chatRef}>
            {messages.map((m, i) => <div key={i} className={`chat-msg ${m.from}`}>{m.text}</div>)}
          </div>
          <div className="chatbot-input">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()} placeholder="Ask me about labs..." />
            <button onClick={handleSend}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
