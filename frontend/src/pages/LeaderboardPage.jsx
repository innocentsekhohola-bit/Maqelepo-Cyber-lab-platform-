import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Leaderboard.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function LeaderboardPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/leaderboard`)
      .then(r => r.json())
      .then(d => { setUsers(d.leaderboard || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="lb-loading"><div className="lb-spinner" /><span>Loading rankings...</span></div>
  );

  return (
    <div className="lb-page">
      <header className="lb-header">
        <div className="lb-logo" onClick={() => navigate("/")}><span>⬡</span><span>CYBER<strong>LAB</strong></span></div>
        <nav>
          <button onClick={() => navigate("/")}>DASHBOARD</button>
          <button onClick={() => navigate("/labs")}>LABS</button>
          <button onClick={() => navigate("/profile")}>PROFILE</button>
        </nav>
      </header>

      <main className="lb-main">
        <h1 className="lb-title">🏆 Global Leaderboard</h1>
        <p className="lb-subtitle">Top operators ranked by total points</p>

        <div className="lb-table">
          <div className="lb-row lb-header-row">
            <span className="lb-rank">#</span>
            <span className="lb-user">Operator</span>
            <span className="lb-level">Rank</span>
            <span className="lb-labs">Labs</span>
            <span className="lb-pts">Points</span>
          </div>
          {users.map((user, i) => (
            <div key={i} className={`lb-row ${i < 3 ? `lb-top-${i + 1}` : ''}`}>
              <span className="lb-rank">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : user.rank}
              </span>
              <span className="lb-user">{user.username}</span>
              <span className="lb-level">{user.level}</span>
              <span className="lb-labs">{user.completed_labs}</span>
              <span className="lb-pts">{user.points.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
