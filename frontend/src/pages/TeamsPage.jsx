import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Teams.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [newTeam, setNewTeam] = useState("");
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchTeams = async () => {
    const res = await fetch(`${API}/teams`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setTeams(data.teams || []);
  };

  const fetchLeaderboard = async () => {
    const res = await fetch(`${API}/teams/leaderboard`);
    const data = await res.json();
    setLeaderboard(data.teams || []);
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchTeams();
    fetchLeaderboard();
  }, []);

  const createTeam = async () => {
    if (!newTeam.trim()) return;
    await fetch(`${API}/teams/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newTeam })
    });
    setNewTeam("");
    setMessage("Team created!");
    fetchTeams();
    fetchLeaderboard();
  };

  const joinTeam = async (id) => {
    await fetch(`${API}/teams/${id}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchTeams();
    navigate(`/teams/${id}`);
  };

  const leaveTeam = async (id) => {
    await fetch(`${API}/teams/${id}/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchTeams();
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
        <p>Create or join a team to compete together!</p>

        {message && <div className="teams-msg">{message}</div>}

        <div className="teams-create">
          <input value={newTeam} onChange={e => setNewTeam(e.target.value)} placeholder="Enter team name..." onKeyDown={e => e.key === "Enter" && createTeam()} />
          <button onClick={createTeam}>Create Team</button>
        </div>

        <h2>All Teams</h2>
        <div className="teams-grid">
          {teams.length === 0 && <p style={{ color: '#4a6a8a' }}>No teams yet. Create the first one!</p>}
          {teams.map(team => (
            <div key={team.id} className="team-card">
              <div className="team-card-top">
                <h3>{team.name}</h3>
                <span className="team-count">{team.member_count} members</span>
              </div>
              <div className="team-members">
                {team.members.map(m => (
                  <span key={m.username} className="team-member-tag">{m.username}</span>
                ))}
              </div>
              <div className="team-actions">
                <button onClick={() => navigate(`/teams/${team.id}`)}>View</button>
                {team.is_member ? (
                  <button className="btn-leave" onClick={() => leaveTeam(team.id)}>Leave</button>
                ) : (
                  <button className="btn-join" onClick={() => joinTeam(team.id)}>Join</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <h2>🏆 Team Leaderboard</h2>
        <div className="teams-lb">
          {leaderboard.map((t, i) => (
            <div key={i} className="teams-lb-row" style={{ background: i === 0 ? 'rgba(255,215,0,0.05)' : i === 1 ? 'rgba(192,192,192,0.03)' : i === 2 ? 'rgba(205,127,50,0.03)' : 'transparent' }}>
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
