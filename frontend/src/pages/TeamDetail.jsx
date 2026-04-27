import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Teams.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function TeamDetail() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [challengesSent, setChallengesSent] = useState([]);
  const [challengesReceived, setChallengesReceived] = useState([]);
  const [teams, setTeams] = useState([]);
  const [labs, setLabs] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedLab, setSelectedLab] = useState("");
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchData = async () => {
    const [teamRes, teamsRes, labsRes] = await Promise.all([
      fetch(`${API}/teams/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/teams`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/labs-list`)
    ]);
    const teamData = await teamRes.json();
    setTeam(teamData.team);
    setChallengesSent(teamData.challenges_sent || []);
    setChallengesReceived(teamData.challenges_received || []);
    setTeams((await teamsRes.json()).teams || []);
    setLabs((await labsRes.json()).labs || []);
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const sendChallenge = async () => {
    if (!selectedTeam || !selectedLab) return;
    const res = await fetch(`${API}/teams/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ challenger_team_id: parseInt(id), challenged_team_id: parseInt(selectedTeam), lab_id: parseInt(selectedLab) })
    });
    setMsg((await res.json()).message || "Sent!");
    fetchData();
  };

  const acceptChallenge = async (cid) => {
    await fetch(`${API}/teams/challenge/${cid}/accept`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  const declineChallenge = async (cid) => {
    await fetch(`${API}/teams/challenge/${cid}/decline`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  if (!team) return <div className="teams-loading">Loading...</div>;

  return (
    <div className="teams-page">
      <header className="teams-header">
        <div className="teams-logo" onClick={() => navigate("/")}>⬡ CYBER<strong>LAB</strong></div>
        <nav>
          <button onClick={() => navigate("/teams")}>← TEAMS</button>
          <button onClick={() => navigate("/")}>DASHBOARD</button>
        </nav>
      </header>
      <main className="teams-main">
        <h1>{team.name}</h1>
        <p>Total Points: <strong style={{ color: '#ffc048' }}>{team.total_points}</strong> | Members: {team.members.length}</p>
        {msg && <div className="teams-msg">{msg}</div>}
        <h2>Members</h2>
        <div className="members-grid">
          {team.members.map(m => (
            <div key={m.username} className="member-card">
              <strong>{m.username}</strong>
              <span>{m.rank}</span>
              <span style={{ color: '#ffc048' }}>{m.points} pts</span>
              <span>{m.labs_completed} labs done</span>
            </div>
          ))}
        </div>
        <h2>⚔️ Challenge Another Team</h2>
        <div className="challenge-form">
          <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}>
            <option value="">Select team...</option>
            {teams.filter(t => t.id !== team.id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select value={selectedLab} onChange={e => setSelectedLab(e.target.value)}>
            <option value="">Select lab...</option>
            {labs.map(l => <option key={l.id} value={l.id}>{l.title} ({l.difficulty})</option>)}
          </select>
          <button onClick={sendChallenge}>Challenge!</button>
        </div>
        <h2>📨 Challenges Received</h2>
        {challengesReceived.length === 0 && <p style={{ color: '#666' }}>No challenges</p>}
        {challengesReceived.map(c => (
          <div key={c.id} className="challenge-card">
            <div><strong>{c.challenger}</strong> → <strong>{c.lab}</strong><br /><span className={`challenge-status ${c.status}`}>{c.status}</span></div>
            {c.status === 'pending' && <div className="challenge-actions"><button className="btn-accept" onClick={() => acceptChallenge(c.id)}>Accept</button><button className="btn-decline" onClick={() => declineChallenge(c.id)}>Decline</button></div>}
            {c.status === 'completed' && <span className="challenge-winner">🏆 {c.winner || 'Tie'} won!</span>}
          </div>
        ))}
        <h2>📤 Challenges Sent</h2>
        {challengesSent.length === 0 && <p style={{ color: '#666' }}>No challenges sent</p>}
        {challengesSent.map(c => (
          <div key={c.id} className="challenge-card">
            <div>To <strong>{c.challenged}</strong> → <strong>{c.lab}</strong><br /><span className={`challenge-status ${c.status}`}>{c.status}</span></div>
            {c.status === 'completed' && <span className="challenge-winner">🏆 {c.winner || 'Tie'} won!</span>}
          </div>
        ))}
      </main>
    </div>
  );
}
