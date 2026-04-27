import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Teams.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [newTeam, setNewTeam] = useState("");
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchData = async () => {
    if (!token) return;
    const [teamsRes, lbRes] = await Promise.all([
      fetch(`${API}/teams`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/teams/leaderboard`)
    ]);
    const teamsData = await teamsRes.json();
    const lbData = await lbRes.json();
    setTeams(teamsData.teams || []);
    setLeaderboard(lbData.teams || []);
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchData();
  }, []);

  const createTeam = async () => {
    if (!newTeam.trim()) return;
    const res = await fetch(`${API}/teams/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newTeam })
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    setNewTeam("");
    fetchData();
  };

  const joinTeam = async (id) => {
    const res = await fetch(`${API}/teams/${id}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    fetchData();
  };

  const leaveTeam = async (id) => {
    const res = await fetch(`${API}/teams/${id}/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setMsg(data.message || data.error);
    fetchData();
  };

  return (
    <div className="teams-page">
      <header className="teams-header">
        <div className="teams-logo" onClick={() => navigate("/")}>⬡ CYBER<strong>LAB</strong></div>
        <nav>
          <button onClick={() => navigate("/")}>DASHBOARD</button>
          <button onClick={() => navigate("/labs")}>LABS</button>
          <button onClick={() => navigate("/leaderboard")}>🏆</button>
          <button onClick={() => navigate("/profile")}>PROFILE</button>
        </nav>
      </header>

      <main className="teams-main">
        <h1>🏴 Teams</h1>
        <p>Create or join a team to compete together</p>

        {msg && <div className="teams-msg">{msg}</div>}

        <div className="teams-create">
          <input value={newTeam} onChange={e => setNewTeam(e.target.value)} placeholder="Team name..." onKeyDown={e => e.key === "Enter" && createTeam()} />
          <button onClick={createTeam}>Create</button>
        </div>

        <h2>All Teams ({teams.length})</h2>
        <div className="teams-grid">
          {teams.length === 0 && <p style={{ color: '#666' }}>No teams yet. Create one!</p>}
          {teams.map(team => (
            <div key={team.id} className="team-card">
              <h3>{team.name}</h3>
              <div className="team-members">
                {team.members.map(m => <span key={m.username} className="team-member-tag">{m.username}</span>)}
              </div>
              <p className="team-count">{team.member_count} members</p>
              {team.is_member ? (
                <button className="btn-leave" onClick={() => leaveTeam(team.id)}>Leave</button>
              ) : (
                <button className="btn-join" onClick={() => joinTeam(team.id)}>Join</button>
              )}
            </div>
          ))}
        </div>

        <h2>🏆 Team Leaderboard</h2>
        <div className="teams-lb">
          {leaderboard.map((t, i) => (
            <div key={i} className="teams-lb-row">
              <span className="lb-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}</span>
              <span className="lb-name">{t.name}</span>
              <span className="lb-pts">{t.points} pts</span>
              <span className="lb-members">{t.members} 👥</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
