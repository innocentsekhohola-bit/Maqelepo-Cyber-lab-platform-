import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LabsPage.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`${API}/campaigns`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setCampaigns(d.campaigns || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="labs-loading"><div className="labs-spinner" /><span>Loading campaigns...</span></div>;

  return (
    <div className="labs-page">
      <header className="labs-header">
        <div className="labs-logo" onClick={() => navigate("/")}><span>⬡</span><span>CYBER<strong>LAB</strong></span></div>
        <nav>
          <button onClick={() => navigate("/")}>DASHBOARD</button>
          <button onClick={() => navigate("/labs")}>LABS</button>
          <button onClick={() => navigate("/leaderboard")}>🏆</button>
          <button onClick={() => navigate("/profile")}>PROFILE</button>
        </nav>
      </header>

      <main className="labs-main">
        <div className="labs-hero">
          <h1>🎯 Campaigns</h1>
          <p>Multi-stage missions. Solve each stage to unlock the next. Real CTF progression.</p>
        </div>

        <div className="labs-grid">
          {campaigns.length === 0 && <p style={{ color: '#666' }}>No campaigns yet.</p>}
          {campaigns.map(c => (
            <div key={c.id} className="lab-card" style={{ borderColor: c.completed ? '#00ff88' : '#f59e0b' }} onClick={() => navigate(`/campaigns/${c.id}`)}>
              <h3 className="lab-title">{c.title}</h3>
              <p className="lab-desc">{c.description}</p>
              <div className="lab-card-footer">
                <span className="lab-category">{c.difficulty}</span>
                <span className="lab-points">{c.points} pts</span>
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>Stage {c.current_stage}/{c.total_stages}</span>
                {c.completed ? (
                  <span style={{ color: '#00ff88', fontWeight: 600 }}>✓ COMPLETE</span>
                ) : c.started ? (
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>▶ IN PROGRESS</span>
                ) : (
                  <button style={{ padding: '0.4rem 1rem', background: '#00ffcc', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>START →</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
