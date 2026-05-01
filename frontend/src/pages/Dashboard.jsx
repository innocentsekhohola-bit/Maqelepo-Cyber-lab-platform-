import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API = "https://maqelepo.pythonanywhere.com/api";

const RANK_COLORS = {
  "Novice": "#6b7280",
  "Script Kiddie": "#10b981",
  "Hacker": "#3b82f6",
  "Elite Hacker": "#8b5cf6",
  "Cyber Ninja": "#f59e0b",
  "Ghost Operative": "#ef4444",
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetch(`${API}/user-progress`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loader"></div>
        <span>Loading Dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return <div className="dash-loading">Failed to load dashboard</div>;
  }

  const { user, stats, completed, in_progress } = data;

  const rankColor = RANK_COLORS[user.rank] || "#6b7280";

  const completionPct =
    stats.total_labs > 0
      ? Math.round((stats.completed_count / stats.total_labs) * 100)
      : 0;

  const RANK_POINTS = {
    "Novice": 0,
    "Script Kiddie": 100,
    "Hacker": 300,
    "Elite Hacker": 600,
    "Cyber Ninja": 1000,
    "Ghost Operative": 2000,
  };

  const RANK_ORDER = Object.keys(RANK_POINTS);
  const nextRankIndex = RANK_ORDER.indexOf(user.rank) + 1;
  const nextRank = RANK_ORDER[nextRankIndex] || null;

  const currentThreshold = RANK_POINTS[user.rank] || 0;
  const nextThreshold = nextRank ? RANK_POINTS[nextRank] : null;

  const rankProgress = nextThreshold
    ? Math.min(
        100,
        Math.round(
          ((user.total_points - currentThreshold) /
            (nextThreshold - currentThreshold)) *
            100
        )
      )
    : 100;

  return (
    <div className="dashboard">
      
      {/* HEADER */}
      <header className="dash-header">
        <div className="dash-logo">
          <span>⬡</span>
          <span>CYBER<strong>LAB</strong></span>
        </div>

        <nav className="dash-nav">
          <button onClick={() => navigate("/labs")}>LABS</button>
          <button onClick={() => navigate("/leaderboard")}>🏆</button>
          <button onClick={() => navigate("/teams")}>TEAMS</button>
          <button onClick={() => navigate("/profile")}>PROFILE</button>
          <button
            className="dash-logout"
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
          >
            LOGOUT
          </button>
        </nav>
      </header>

      {/* MAIN */}
      <main className="dash-main">

        {/* HERO */}
        <section className="dash-hero">
          <div>
            <p className="dash-greeting">Welcome back, operator</p>
            <h1 className="dash-username">{user.username}</h1>

            <div
              className="dash-rank-badge"
              style={{ borderColor: rankColor, color: rankColor }}
            >
              {user.rank}
            </div>
          </div>

          <div style={{ fontSize: "4rem", opacity: 0.05 }}>⬡</div>
        </section>

        {/* STATS */}
        <section className="dash-stats">
          {[
            {
              label: "Total Points",
              value: user.total_points.toLocaleString(),
              icon: "⚡",
              accent: "#f59e0b",
            },
            {
              label: "Labs Completed",
              value: `${stats.completed_count} / ${stats.total_labs}`,
              icon: "✓",
              accent: "#10b981",
            },
            {
              label: "In Progress",
              value: stats.in_progress_count,
              icon: "◉",
              accent: "#3b82f6",
            },
            {
              label: "Completion",
              value: `${completionPct}%`,
              icon: "▲",
              accent: "#8b5cf6",
            },
          ].map((s) => (
            <div className="dash-stat-card" key={s.label}>
              <div className="dash-stat-icon" style={{ color: s.accent }}>
                {s.icon}
              </div>
              <div className="dash-stat-value" style={{ color: s.accent }}>
                {s.value}
              </div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          ))}
        </section>

        {/* RANK PROGRESS */}
        <section className="dash-rank-section">
          <div className="dash-rank-header">
            <span>Rank Progress</span>
            {nextRank && (
              <span className="dash-next-rank">
                Next: <strong>{nextRank}</strong>
              </span>
            )}
          </div>

          <div className="dash-rank-bar-track">
            <div
              className="dash-rank-bar-fill"
              style={{ width: `${rankProgress}%` }}
            />
          </div>

          <div className="dash-rank-labels">
            <span style={{ color: rankColor }}>{user.rank}</span>
            {nextRank && <span>{nextRank} ({nextThreshold} pts)</span>}
          </div>
        </section>

        {/* GRID */}
        <div className="dash-grid">

          {/* COMPLETED */}
          <section className="dash-panel">
            <h2 className="dash-panel-title">
              <span className="dot green"></span> Recent Completions
            </h2>

            {completed.length === 0 ? (
              <p className="dash-empty">
                No labs yet.{" "}
                <button onClick={() => navigate("/labs")}>
                  Start one →
                </button>
              </p>
            ) : (
              <ul className="dash-lab-list">
                {completed.slice(0, 5).map((p) => (
                  <li key={p.id} className="dash-lab-item completed">
                    <div>
                      <div className="dli-title">{p.lab_title}</div>
                      <div className="dli-cat">{p.lab_category}</div>
                    </div>
                    <span className="dli-points">
                      +{p.points_earned} pts
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* IN PROGRESS */}
          <section className="dash-panel">
            <h2 className="dash-panel-title">
              <span className="dot yellow"></span> In Progress
            </h2>

            {in_progress.length === 0 ? (
              <p className="dash-empty">
                All clear.{" "}
                <button onClick={() => navigate("/labs")}>
                  Pick a lab →
                </button>
              </p>
            ) : (
              <ul className="dash-lab-list">
                {in_progress.map((p) => (
                  <li
                    key={p.id}
                    className="dash-lab-item inprogress"
                    onClick={() => navigate(`/labs/${p.lab_id}`)}
                  >
                    <div>
                      <div className="dli-title">{p.lab_title}</div>
                      <div className="dli-cat">{p.lab_category}</div>
                    </div>
                    <span className="dli-attempts">
                      {p.attempts} attempts
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>

        {/* FOOTER */}
        <footer className="dash-footer">
          © {new Date().getFullYear()} CyberLab Platform — Built by{" "}
          <strong style={{ color: "#00ffcc" }}>
            Sekhohola Joseph Maqelepo
          </strong>{" "}
          — Lesotho 🇱🇸
        </footer>

      </main>
    </div>
  );
      }
