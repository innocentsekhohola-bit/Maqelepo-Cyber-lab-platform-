import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Teams.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [newTeam, setNewTeam] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [teamsRes, lbRes] = await Promise.all([
        fetch(`${API}/teams`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/teams/leaderboard`)
      ]);
      const teamsData = await teamsRes.json();
      const lbData = await lbRes.json();
      setTeams(teamsData.teams || []);
      setLeaderboard(lbData.teams || []);
    } catch (e) {
      console.log("Error");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchData();
  }, [fetchData]);

  const createTeam = async () => {
    if (!newTeam.trim()) return;
    const res = await fetch(`${API}/teams/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newTeam })
    });
    const data = await res.json();
    if (data.team) {
      setMsg("Team created!");
      setNewTeam("");
      fetchData();
    } else {
      setMsg(data.error || "Failed");
    }
  };

  const joinTeam = async (id) => {
    await fetch(`${API}/teams/${id}/join`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  const leaveTeam = async (id) => {
    await fetch(`${API}/teams/${id}/leave`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  if (loading) return <div className="teams-loading">Loading...</div>;

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
        {msg && <div className="teams-msg" onClick={() => setMsg("")}>{msg}</div>}
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
              <div className="team-members">{team.members.map(m => <span key={m.username} className="team-member-tag">{m.username}</span>)}</div>
              <p className="team-count">{team.member_count} members</p>
              <div className="team-actions">
                <button onClick={() => navigate(`/teams/${team.id}`)}>View</button>
                {team.is_member ? <button className="btn-leave" onClick={() => leaveTeam(team.id)}>Leave</button> : <button className="btn-join" onClick={() => joinTeam(team.id)}>Join</button>}
              </div>
            </div>
          ))}
        </div>
        <h2>🏆 Team Leaderboard</h2>
        <div className="teams-lb">
          {leaderboard.length === 0 && <p style={{ color: '#666', padding: '1rem' }}>No teams ranked yet</p>}
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
