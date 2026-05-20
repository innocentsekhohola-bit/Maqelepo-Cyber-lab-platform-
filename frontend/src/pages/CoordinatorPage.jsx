import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CoordinatorPage.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function CoordinatorPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`${API}/coordinator`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="coord-loading">Loading Coordinator Dashboard...</div>;
  if (!data) return <div className="coord-loading">Failed to load</div>;

  return (
    <div className="coord-page">
      <header className="coord-header">
        <div className="coord-logo" onClick={() => navigate("/")}>⬡ CYBER<strong>LAB</strong></div>
        <nav className="coord-nav">
          <button onClick={() => navigate("/")}>DASHBOARD</button>
          <button onClick={() => navigate("/labs")}>LABS</button>
          <button onClick={() => navigate("/leaderboard")}>🏆</button>
        </nav>
      </header>

      <main className="coord-main">
        <h1 className="coord-title">🎯 Coordinator Dashboard</h1>
        <p className="coord-subtitle">
          Team Score: <strong>{data.team_score} pts</strong> | Labs: {data.total_labs} | Members: {data.total_users}
        </p>

        <h2 className="coord-section-title">Lab Completion Status</h2>
        {data.labs.map(lab => (
          <div key={lab.id} className="lab-row">
            <div className="lab-row-top">
              <div>
                <span className="lab-title">{lab.title}</span>
                <span className="lab-meta">{lab.category} | {lab.difficulty} | {lab.points} pts</span>
              </div>
              <span className={`lab-status ${lab.total_solvers > 0 ? 'solved' : 'unsolved'}`}>
                {lab.total_solvers > 0 ? `✓ Solved (${lab.total_solvers})` : '❌ Unsolved'}
              </span>
            </div>
            {lab.completions.length > 0 && (
              <div className="solver-tags">
                {lab.completions.map(c => (
                  <span key={c.username} className="solver-tag">{c.username} (+{c.points_earned}pts)</span>
                ))}
              </div>
            )}
          </div>
        ))}

        <h2 className="coord-section-title" style={{ marginTop: '2rem' }}>Flag Collection Log</h2>
        <div className="flag-log">
          {data.flags_collected.slice(0, 20).map((f, i) => (
            <div key={i} className="flag-row">
              <span><span className="flag-user">{f.username}</span> — <span className="flag-lab">{f.lab}</span></span>
              <span className="flag-pts">+{f.points} pts</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
