import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API = "https://maqelepo.pythonanywhere.com/api";

const RANK_COLORS = {
  "Novice": "#6b7280", "Script Kiddie": "#10b981", "Hacker": "#3b82f6",
  "Elite Hacker": "#8b5cf6", "Cyber Ninja": "#f59e0b", "Ghost Operative": "#ef4444",
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetch(`${API}/user-progress`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [navigate]);

  if (loading) return (
    <div className="dash-loading"><div className="dash-loader" /><span>Loading...</span></div>
  );

  if (!data) return <div className="dash-loading">Failed to load</div>;

  const { user, stats, completed, in_progress } = data;
  const rankColor = RANK_COLORS[user.rank] || "#6b7280";
  const completionPct = stats.total_labs > 0 ? Math.round((stats.completed_count / stats.total_labs) * 100) : 0;

  const RANK_POINTS = { "Novice": 0, "Script Kiddie": 100, "Hacker": 300, "Elite Hacker": 600, "Cyber Ninja": 1000, "Ghost Operative": 2000 };
  const RANK_ORDER = Object.keys(RANK_COLORS);
  const nextRankIndex = RANK_ORDER.indexOf(user.rank) + 1;
  const nextRank = RANK_ORDER[nextRankIndex] || null;
  const currentThreshold = RANK_POINTS[user.rank] || 0;
  const nextThreshold = nextRank ? RANK_POINTS[nextRank] : null;
  const rankProgress = nextThreshold ? Math.min(100, Math.round(((user.total_points - currentThreshold) / (nextThreshold - currentThreshold)) * 100)) : 100;

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-logo"><span className="dash-logo-icon">⬡</span>CyberLab</div>
        <nav className="dash-nav">
          <button onClick={() => navigate("/labs")}>Labs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button className="dash-logout" onClick={() => { localStorage.clear(); navigate("/login"); }}>Logout</button>
        </nav>
      </header>

      <main className="dash-main">
        <section className="dash-hero">
          <div>
            <p className="dash-greeting">Welcome back,</p>
            <h1 className="dash-username">{user.username}</h1>
            <div className="dash-rank-badge" style={{ borderColor: rankColor, color: rankColor }}>
              {user.rank}
            </div>
          </div>
          <div style={{ fontSize: '4rem', opacity: 0.1 }}>⬡</div>
        </section>

        <section className="dash-stats">
          {[
            { label: "Points", value: user.total_points.toLocaleString(), icon: "⚡", color: "#ffc048" },
            { label: "Completed", value: `${stats.completed_count}/${stats.total_labs}`, icon: "✓", color: "#00ff88" },
            { label: "In Progress", value: stats.in_progress_count, icon: "◉", color: "#3b82f6" },
            { label: "Completion", value: `${completionPct}%`, icon: "▲", color: "#8b5cf6" },
          ].map(s => (
            <div className="dash-stat-card" key={s.label}>
              <div className="dash-stat-icon">{s.icon}</div>
              <div className="dash-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          ))}
        </section>

        <section className="dash-rank-section">
          <div className="dash-rank-header">
            <span>Rank Progress</span>
            {nextRank && <span className="dash-next-rank">Next: <strong>{nextRank}</strong></span>}
          </div>
          <div className="dash-rank-bar-track">
            <div className="dash-rank-bar-fill" style={{ width: `${rankProgress}%` }} />
          </div>
          <div className="dash-rank-labels">
            <span style={{ color: rankColor }}>{user.rank}</span>
            {nextRank && <span>{nextRank} ({nextThreshold} pts)</span>}
          </div>
        </section>

        <div className="dash-grid">
          <section className="dash-panel">
            <h2 className="dash-panel-title"><span className="dot green" />Completed</h2>
            {completed.length === 0 ? (
              <p className="dash-empty"><button onClick={() => navigate("/labs")}>Start your first lab →</button></p>
            ) : (
              <ul className="dash-lab-list">
                {completed.slice(0, 5).map(p => (
                  <li key={p.id} className="dash-lab-item">
                    <div><div className="dli-title">{p.lab_title}</div><div className="dli-cat">{p.lab_category}</div></div>
                    <span className="dli-points">+{p.points_earned} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="dash-panel">
            <h2 className="dash-panel-title"><span className="dot yellow" />In Progress</h2>
            {in_progress.length === 0 ? (
              <p className="dash-empty"><button onClick={() => navigate("/labs")}>Pick a lab →</button></p>
            ) : (
              <ul className="dash-lab-list">
                {in_progress.map(p => (
                  <li key={p.id} className="dash-lab-item" onClick={() => navigate(`/labs/${p.lab_id}`)}>
                    <div><div className="dli-title">{p.lab_title}</div><div className="dli-cat">{p.lab_category}</div></div>
                    <span className="dli-attempts">{p.attempts} attempts</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
