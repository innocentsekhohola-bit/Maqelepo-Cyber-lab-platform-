import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const RANK_META = {
  "Novice":          { color: "#6b7280", icon: "◈", next_pts: 100 },
  "Script Kiddie":   { color: "#10b981", icon: "◉", next_pts: 300 },
  "Hacker":          { color: "#3b82f6", icon: "⬡", next_pts: 600 },
  "Elite Hacker":    { color: "#8b5cf6", icon: "✦", next_pts: 1000 },
  "Cyber Ninja":     { color: "#f59e0b", icon: "⚡", next_pts: 2000 },
  "Ghost Operative": { color: "#ef4444", icon: "☠", next_pts: null },
};

const DIFF_COLORS = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" };

function RadialProgress({ pct, color, size = 100 }) {
  const r = (size / 2) - 8;
  const circumference = 2 * Math.PI * r;
  const dash = (pct / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a2d45" strokeWidth="6" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease", filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}

export default function ProfilePage() {
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
    <div className="profile-loading">
      <div className="profile-spinner" />
      <span>Loading operator profile...</span>
    </div>
  );

  if (!data) return <div className="profile-error">Failed to load profile.</div>;

  const { user, stats, completed } = data;
  const meta = RANK_META[user.rank] || RANK_META.Novice;
  const rankColor = meta.color;

  const completionPct = stats.total_labs > 0
    ? Math.round((stats.completed_count / stats.total_labs) * 100) : 0;

  // Points towards next rank
  const RANK_POINTS = { "Novice": 0, "Script Kiddie": 100, "Hacker": 300, "Elite Hacker": 600, "Cyber Ninja": 1000, "Ghost Operative": 2000 };
  const currentThreshold = RANK_POINTS[user.rank] || 0;
  const nextPts = meta.next_pts;
  const rankPct = nextPts
    ? Math.min(100, Math.round(((user.total_points - currentThreshold) / (nextPts - currentThreshold)) * 100))
    : 100;

  // Category breakdown from completed
  const catBreakdown = {};
  completed.forEach(p => {
    catBreakdown[p.lab_category] = (catBreakdown[p.lab_category] || 0) + 1;
  });

  const totalPossiblePts = completed.reduce((acc, p) => acc + (p.points_earned || 0), 0);

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-logo" onClick={() => navigate("/")}>
          <span>⬡</span> <span>CYBER<strong>LAB</strong></span>
        </div>
        <nav>
          <button onClick={() => navigate("/")}>DASHBOARD</button>
          <button onClick={() => navigate("/labs")}>LABS</button>
          <button className="logout-btn" onClick={() => { localStorage.clear(); navigate("/login"); }}>LOGOUT</button>
        </nav>
      </header>

      <main className="profile-main">
        {/* Hero card */}
        <section className="profile-hero-card">
          <div className="hero-avatar" style={{ "--rank-color": rankColor }}>
            <span className="hero-avatar-icon">{meta.icon}</span>
          </div>
          <div className="hero-info">
            <h1 className="hero-username">{user.username}</h1>
            <p className="hero-email">{user.email}</p>
            <div className="hero-rank-badge" style={{ color: rankColor, borderColor: rankColor }}>
              {meta.icon} {user.rank}
            </div>
            <p className="hero-joined">
              Operator since {new Date(user.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
            </p>
          </div>

          {/* Radial charts */}
          <div className="hero-radials">
            <div className="radial-item">
              <div className="radial-wrap">
                <RadialProgress pct={completionPct} color={rankColor} size={90} />
                <span className="radial-center">{completionPct}%</span>
              </div>
              <span className="radial-label">Completion</span>
            </div>
            <div className="radial-item">
              <div className="radial-wrap">
                <RadialProgress pct={rankPct} color="#00aaff" size={90} />
                <span className="radial-center">{rankPct}%</span>
              </div>
              <span className="radial-label">To Next Rank</span>
            </div>
          </div>
        </section>

        {/* Stat tiles */}
        <section className="profile-stats-row">
          {[
            { label: "Total Points", value: user.total_points.toLocaleString(), color: "#ffcc00", icon: "◈" },
            { label: "Labs Completed", value: stats.completed_count, color: "#10b981", icon: "✓" },
            { label: "Labs Available", value: stats.total_labs, color: "#3b82f6", icon: "⬡" },
            { label: "Points Earned", value: totalPossiblePts.toLocaleString(), color: "#8b5cf6", icon: "▲" },
          ].map(s => (
            <div className="profile-stat-tile" key={s.label} style={{ "--tc": s.color }}>
              <span className="pst-icon">{s.icon}</span>
              <span className="pst-val">{s.value}</span>
              <span className="pst-label">{s.label}</span>
            </div>
          ))}
        </section>

        {/* Category breakdown */}
        {Object.keys(catBreakdown).length > 0 && (
          <section className="profile-section">
            <h2 className="section-title">Expertise Breakdown</h2>
            <div className="cat-grid">
              {Object.entries(catBreakdown).map(([cat, count]) => (
                <div className="cat-item" key={cat}>
                  <span className="cat-name">{cat}</span>
                  <div className="cat-bar-track">
                    <div
                      className="cat-bar-fill"
                      style={{ width: `${Math.min(100, (count / stats.completed_count) * 100)}%` }}
                    />
                  </div>
                  <span className="cat-count">{count}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Completed labs */}
        <section className="profile-section">
          <h2 className="section-title">Completed Labs <span className="section-count">{completed.length}</span></h2>
          {completed.length === 0 ? (
            <div className="profile-empty">
              No completed labs yet. <button onClick={() => navigate("/labs")}>Start your first lab →</button>
            </div>
          ) : (
            <div className="completed-list">
              {completed.map(p => (
                <div
                  key={p.id}
                  className="completed-item"
                  onClick={() => navigate(`/labs/${p.lab_id}`)}
                  style={{ "--dc": DIFF_COLORS[p.lab_difficulty] || "#10b981" }}
                >
                  <div className="ci-left">
                    <span className="ci-title">{p.lab_title}</span>
                    <div className="ci-meta">
                      <span className="ci-cat">{p.lab_category}</span>
                      <span className="ci-diff" style={{ color: DIFF_COLORS[p.lab_difficulty] }}>
                        {p.lab_difficulty}
                      </span>
                      {p.completed_at && (
                        <span className="ci-date">
                          {new Date(p.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ci-right">
                    <span className="ci-pts">+{p.points_earned} pts</span>
                    {p.hints_used > 0 && <span className="ci-hints">{p.hints_used} hints</span>}
                  </div>
                  <span className="ci-check">✓</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
