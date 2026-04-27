import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Teams.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [newTeam, setNewTeam] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`${API}/teams`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setTeams(d.teams || []));
    fetch(`${API}/teams/leaderboard`)
      .then(r => r.json()).then(d => setLeaderboard(d.teams || []));
    setLoading(false);
  }, []);

  const createTeam = async () => {
    if (!newTeam.trim()) return;
    await fetch(`${API}/teams/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newTeam })
    });
    setNewTeam("");
    window.location.reload();
  };

  const joinTeam = async (id) => {
    await fetch(`${API}/teams/${id}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    navigate(`/teams/${id}`);
  };

  if (loading) return <div className="teams-loading">Loading...</div>;

  return (
    <div className="teams-page">
      <header className="teams-header">
        <div className="teams-logo" onClick={() => navigate("/")}>⬡ CYBER<strong>LAB</strong></div>
        <nav>
          <button onClick={() => navigate("/")}>DASHBOARD</button>
          <button onClick={() => navigate("/labs")}>LABS</button>
        </nav>
      </header>

      <main className="teams-main">
        <h1>🏴 Teams</h1>

        <div className="teams-create">
          <input value={newTeam} onChange={e => setNewTeam(e.target.value)} placeholder="Team name..." />
          <button onClick={createTeam}>Create Team</button>
        </div>

        <h2>Join a Team</h2>
        <div className="teams-grid">
          {teams.map(team => (
            <div key={team.id} className="team-card" onClick={() => joinTeam(team.id)}>
              <h3>{team.name}</h3>
              <p>{team.member_count} members</p>
            </div>
          ))}
        </div>

        <h2>🏆 Team Leaderboard</h2>
        <div className="teams-lb">
          {leaderboard.map((t, i) => (
            <div key={i} className="teams-lb-row">
              <span>#{i+1}</span>
              <span>{t.name}</span>
              <span>{t.points} pts</span>
              <span>{t.members} members</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
