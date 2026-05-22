import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./LabPlayer.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function CampaignPlayer() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flagInput, setFlagInput] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`${API}/campaigns/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setCampaign(d.campaign); setStages(d.stages || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const submitFlag = async () => {
    if (!flagInput.trim()) return;
    const res = await fetch(`${API}/campaigns/${id}/submit-stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ flag: flagInput })
    });
    const data = await res.json();
    if (data.message) {
      setMsg(data.message);
      setFlagInput("");
      window.location.reload();
    } else {
      setMsg(data.error || "Incorrect");
    }
  };

  if (loading) return <div className="player-loading"><div className="player-spinner" /><span>Loading campaign...</span></div>;
  if (!campaign) return <div className="player-loading">Not found.</div>;

  return (
    <div className="player-page">
      <aside className="player-sidebar">
        <div className="player-sidebar-top">
          <button className="back-btn" onClick={() => navigate("/campaigns")}>← CAMPAIGNS</button>
          <h2 className="sidebar-title">{campaign.title}</h2>
          <p className="sidebar-desc">{campaign.story}</p>
          <div className="sidebar-meta">
            <div className="meta-row"><span className="meta-label">Difficulty</span><span className="meta-val">{campaign.difficulty}</span></div>
            <div className="meta-row"><span className="meta-label">Points</span><span className="meta-val" style={{ color: "#ffcc00" }}>{campaign.points}</span></div>
            <div className="meta-row"><span className="meta-label">Stage</span><span className="meta-val">{campaign.current_stage}/{stages.length}</span></div>
            <div className="meta-row"><span className="meta-label">Status</span><span className="meta-val" style={{ color: campaign.completed ? "#00ff88" : "#f59e0b" }}>{campaign.completed ? "✓ COMPLETE" : "IN PROGRESS"}</span></div>
          </div>
        </div>

        {stages.map(s => (
          <div key={s.id} style={{ margin: '0 1rem 0.75rem', padding: '0.75rem', background: s.current ? 'rgba(0,255,204,0.08)' : s.completed ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.02)', border: s.current ? '1px solid #00ffcc' : '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', opacity: s.unlocked ? 1 : 0.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>Stage {s.order}: {s.title}</span>
              <span style={{ fontSize: '0.7rem', color: '#888' }}>{s.category} | {s.points}pts</span>
            </div>
            {s.unlocked && (
              <>
                <p style={{ fontSize: '0.78rem', color: '#aaa', marginBottom: '0.4rem' }}>{s.objective}</p>
                {s.current && (
                  <div className="flag-submit-box" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent' }}>
                    <input className="flag-input" placeholder="Submit flag..." value={flagInput} onChange={e => setFlagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && submitFlag()} style={{ marginBottom: '0.3rem' }} />
                    <button className="flag-btn" onClick={submitFlag}>SUBMIT</button>
                    {msg && <div className="flag-feedback" style={{ marginTop: '0.3rem' }}>{msg}</div>}
                  </div>
                )}
              </>
            )}
            {s.completed && <span style={{ color: '#00ff88', fontSize: '0.75rem' }}>✓ Completed</span>}
          </div>
        ))}
      </aside>

      <div className="player-terminal-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>🎯 Multi-Stage Campaign</h2>
          <p>Complete each stage by submitting the correct flag.</p>
          <p>Each stage unlocks the next. Reach the final stage to complete the campaign.</p>
          <p style={{ marginTop: '1rem', color: '#00ffcc' }}>Use the flag input on the left to submit your answers.</p>
        </div>
      </div>
    </div>
  );
                      }
