import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function CoordinatorPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`${API}/coordinator`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div style={{ background: '#050a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Loading Coordinator Dashboard...</div>;
  if (!data) return <div style={{ background: '#050a0f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Failed to load</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#050a0f', color: '#e5e7eb', fontFamily: 'Space Grotesk, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '0 2rem', height: '64px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,15,0.9)' }}>
        <div style={{ fontWeight: 700, color: '#00ffcc', cursor: 'pointer' }} onClick={() => navigate("/")}>⬡ CYBER<strong>LAB</strong></div>
        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => navigate("/")} style={{ background: 'none', border: 'none', color: '#888', padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>DASHBOARD</button>
          <button onClick={() => navigate("/labs")} style={{ background: 'none', border: 'none', color: '#888', padding: '0.5rem 1rem', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif' }}>LABS</button>
        </nav>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: '0.5rem' }}>🎯 Coordinator Dashboard</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>Team Score: <strong style={{ color: '#ffc048' }}>{data.team_score} pts</strong> | Labs: {data.total_labs} | Members: {data.total_users}</p>

        <h2 style={{ color: '#888', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em' }}>Lab Completion Status</h2>
        {data.labs.map(lab => (
          <div key={lab.id} style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <strong style={{ color: '#fff' }}>{lab.title}</strong>
                <span style={{ color: '#666', marginLeft: '1rem', fontSize: '0.8rem' }}>{lab.category} | {lab.difficulty} | {lab.points} pts</span>
              </div>
              <span style={{ color: lab.total_solvers > 0 ? '#00ff88' : '#ff4d6d', fontWeight: 600 }}>
                {lab.total_solvers > 0 ? `✓ Solved (${lab.total_solvers})` : '❌ Unsolved'}
              </span>
            </div>
            {lab.completions.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {lab.completions.map(c => (
                  <span key={c.username} style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', color: '#00ff88' }}>
                    {c.username} (+{c.points_earned}pts)
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        <h2 style={{ color: '#888', margin: '2rem 0 1rem', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.1em' }}>Flag Collection Log</h2>
        <div style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
          {data.flags_collected.slice(0, 20).map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
              <span><strong style={{ color: '#00ffcc' }}>{f.username}</strong> — {f.lab}</span>
              <span style={{ color: '#ffc048' }}>+{f.points} pts</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
        }
