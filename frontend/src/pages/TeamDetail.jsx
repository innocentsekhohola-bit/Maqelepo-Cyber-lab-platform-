import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Teams.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function TeamDetail() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchTeam = async () => {
    const res = await fetch(`${API}/teams/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setTeam(data.team);
    setChat(data.chat || []);
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchTeam();
    const interval = setInterval(fetchTeam, 5000);
    return () => clearInterval(interval);
  }, []);

  const sendMsg = async () => {
    if (!msg.trim()) return;
    await fetch(`${API}/teams/${id}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: msg })
    });
    setMsg("");
    fetchTeam();
  };

  if (!team) return <div className="teams-loading">Loading...</div>;

  return (
    <div className="teams-page">
      <header className="teams-header">
        <div className="teams-logo" onClick={() => navigate("/")}>⬡ CYBER<strong>LAB</strong></div>
        <nav>
          <button onClick={() => navigate("/teams")}>← TEAMS</button>
        </nav>
      </header>

      <main className="teams-main">
        <h1>{team.name}</h1>
        <p>Total Points: <strong style={{ color: '#ffc048' }}>{team.total_points}</strong></p>

        <h2>Members</h2>
        <div className="members-grid">
          {team.members.map(m => (
            <div key={m.username} className="member-card">
              <strong>{m.username}</strong>
              <span>{m.rank}</span>
              <span style={{ color: '#ffc048' }}>{m.points} pts</span>
              <span>{m.completed_labs} labs done</span>
            </div>
          ))}
        </div>

        <h2>Team Chat</h2>
        <div className="chat-box">
          {chat.map((c, i) => (
            <div key={i} className="chat-msg">
              <strong>{c.username}:</strong> {c.message}
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === "Enter" && sendMsg()} />
          <button onClick={sendMsg}>Send</button>
        </div>
      </main>
    </div>
  );
}
