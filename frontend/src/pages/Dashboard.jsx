import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API = "https://maqelepo-cyber-lab-platform-production.up.railway.app/api";
const RANK_COLORS = {
  "Novice": "#6b7280",
  "Script Kiddie": "#10b981",
  "Hacker": "#3b82f6",
  "Elite Hacker": "#8b5cf6",
  "Cyber Ninja": "#f59e0b",
  "Ghost Operative": "#ef4444",
};

const RANK_ICONS = {
  "Novice": "◈",
  "Script Kiddie": "◉",
  "Hacker": "⬡",
  "Elite Hacker": "✦",
  "Cyber Ninja": "⚡",
  "Ghost Operative": "☠",
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    fetch(`${API}/user-progress`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load dashboard"); setLoading(false); });
  }, [navigate]);

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-loader" />
      <span>Loading operator data...</span>
    </div>
  );

  if (error) return <div className="dash-error">{error}</div>;

  const { user, stats, completed, in_progress } = data;
  const rankColor = RANK_COLORS[user.rank] || "#6b7280";
  const rankIcon = RANK_ICONS[user.rank] || "◈";
  const completionPct = stats.total_labs > 0
    ? Math.round((stats.completed_count / stats.total_labs) * 100)
    : 0;

  const RANK_ORDER = Object.keys(RANK_COLORS);
  const nextRankIndex = RANK_ORDER.indexOf(user.rank) + 1;
  const nextRank = RANK_ORDER[nextRankIndex] || null;

  const RANK_POINTS = { "Novice": 0, "Script Kiddie": 100, "Hacker": 300, "Elite Hacker": 600, "Cyber Ninja": 1000, "Ghost Operative": 2000 };
  const currentThreshold = RANK_POINTS[user.rank] || 0;
  const nextThreshold = nextRank ? RANK_POINTS[nextRank] : null;
  const rankProgress = nextThreshold
    ? Math.min(100, Math.round(((user.total_points - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
    : 100;

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-logo">
          <span className="dash-logo-icon">⬡</span>
          <span>CYBER<strong>LAB</strong></span>
        </div>
        <nav className="dash-nav">
          <button onClick={() => navigate("/labs")}>LABS</button>
          <button onClick={() => navigate("/profile")}>PROFILE</button>
          <button className="dash-logout" onClick={() => { localStorage.clear(); navigate("/login"); }}>LOGOUT</button>
        </nav>
      </header>

      <main className="dash-main">
        {/* Welcome banner */}
        <section className="dash-hero">
          <div className="dash-hero-left">
            <p className="dash-greeting">Welcome back, operator</p>
            <h1 className="dash-username">{user.username}</h1>
            <div className="dash-rank-badge" style={{ "--rank-color": rankColor }}>
              <span className="dash-rank-icon">{rankIcon}</span>
              <span>{user.rank}</span>
            </div>
          </div>
          <div className="dash-hero-right">
            <div className="dash-scanline" />
          </div>
        </section>

        {/* Stat cards */}
        <section className="dash-stats">
          {[
            { label: "Total Points", value: user.total_points.toLocaleString(), icon: "◈", accent: "#f59e0b" },
            { label: "Labs Completed", value: `${stats.completed_count} / ${stats.total_labs}`, icon: "⬡", accent: "#10b981" },
            { label: "In Progress", value: stats.in_progress_count, icon: "◉", accent: "#3b82f6" },
            { label: "Completion", value: `${completionPct}%`, icon: "▲", accent: "#8b5cf6" },
          ].map(s => (
            <div className="dash-stat-card" key={s.label} style={{ "--accent": s.accent }}>
              <div className="dash-stat-icon">{s.icon}</div>
              <div className="dash-stat-value">{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Rank progress */}
        <section className="dash-rank-section">
          <div className="dash-rank-header">
            <span>Rank Progress</span>
            {nextRank && <span className="dash-next-rank">Next: <strong>{nextRank}</strong></span>}
          </div>
          <div className="dash-rank-bar-track">
            <div
              className="dash-rank-bar-fill"
              style={{ width: `${rankProgress}%`, "--rank-color": rankColor }}
            />
          </div>
          <div className="dash-rank-labels">
            <span style={{ color: rankColor }}>{user.rank}</span>
            {nextRank && <span>{nextRank} ({nextThreshold} pts)</span>}
          </div>
        </section>

        {/* Two columns: recent completed + in progress */}
        <div className="dash-grid">
          <section className="dash-panel">
            <h2 className="dash-panel-title"><span className="dot green" />Recently Completed</h2>
            {completed.length === 0 ? (
              <p className="dash-empty">No labs completed yet. <button onClick={() => navigate("/labs")}>Start one →</button></p>
            ) : (
              <ul className="dash-lab-list">
                {completed.slice(0, 5).map(p => (
                  <li key={p.id} className="dash-lab-item completed">
                    <div className="dli-left">
                      <span className="dli-title">{p.lab_title}</span>
                      <span className="dli-cat">{p.lab_category} · {p.lab_difficulty}</span>
                    </div>
                    <span className="dli-points">+{p.points_earned} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dash-panel">
            <h2 className="dash-panel-title"><span className="dot yellow" />In Progress</h2>
            {in_progress.length === 0 ? (
              <p className="dash-empty">All clear. <button onClick={() => navigate("/labs")}>Pick a lab →</button></p>
            ) : (
              <ul className="dash-lab-list">
                {in_progress.slice(0, 5).map(p => (
                  <li key={p.id} className="dash-lab-item inprogress"
                    onClick={() => navigate(`/labs/${p.lab_id}`)} style={{ cursor: "pointer" }}>
                    <div className="dli-left">
                      <span className="dli-title">{p.lab_title}</span>
                      <span className="dli-cat">{p.lab_category} · {p.lab_difficulty}</span>
                    </div>
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
