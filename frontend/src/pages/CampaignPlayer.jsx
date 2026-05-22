import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import "./LabPlayer.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function CampaignPlayer() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [stages, setStages] = useState([]);
  const [currentStage, setCurrentStage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flagInput, setFlagInput] = useState("");
  const [msg, setMsg] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  
  const termRef = useRef(null);
  const terminalRef = useRef(null);
  const fitRef = useRef(null);
  const currentLine = useRef("");
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`${API}/campaigns/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setCampaign(d.campaign);
        setStages(d.stages || []);
        const curr = d.stages.find(s => s.current);
        setCurrentStage(curr);
        setLoading(false);
      })
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
      setMsg("✅ " + data.message);
      setFlagInput("");
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setMsg("❌ " + (data.error || "Incorrect"));
    }
  };

  useEffect(() => {
    if (loading || !currentStage || terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', monospace",
      theme: { background: "#050a0f", foreground: "#c8d8e8", cursor: "#00ff88" },
      cols: 80, rows: 24,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(termRef.current);
    fit.fit();
    fitRef.current = fit;
    terminalRef.current = term;

    const welcome = [
      "\r\n\x1b[1;36m  ╔═══════════════════════════════════════╗\x1b[0m",
      "\x1b[1;36m  ║     CAMPAIGN: " + campaign.title.substring(0, 25).padEnd(25) + " ║\x1b[0m",
      "\x1b[1;36m  ║  Stage " + currentStage.order + ": " + currentStage.title.substring(0, 28).padEnd(28) + " ║\x1b[0m",
      "\x1b[1;36m  ╚═══════════════════════════════════════╝\x1b[0m",
      "",
      `\x1b[1;33m  Category: ${currentStage.category}  |  Points: ${currentStage.points}\x1b[0m`,
      "",
      `  ${currentStage.objective}`,
      "",
      `  Commands: ${(currentStage.allowed_commands || []).join(', ')} | hint | clear`,
      "",
    ];
    welcome.forEach(line => term.writeln(line));
    term.write("\x1b[1;32m$ \x1b[0m");

    term.onData(async (data) => {
      const code = data.charCodeAt(0);
      if (code === 13) {
        const cmd = currentLine.current.trim();
        term.writeln("");
        currentLine.current = "";
        if (!cmd) { term.write("\x1b[1;32m$ \x1b[0m"); return; }
        if (cmd === "clear") { term.clear(); term.write("\x1b[1;32m$ \x1b[0m"); return; }
        if (cmd === "help") {
          term.writeln("Commands: " + (currentStage.allowed_commands || []).join(', '));
          term.writeln("  hint    Show hint");
          term.writeln("  clear   Clear terminal");
          term.writeln("  flag    Show flag submit tip");
          term.write("\x1b[1;32m$ \x1b[0m"); return;
        }
        if (cmd === "hint") {
          if (hintsUsed < (currentStage.hints || []).length) {
            term.writeln(`\x1b[1;33m[HINT] ${currentStage.hints[hintsUsed]}\x1b[0m`);
            setHintsUsed(hintsUsed + 1);
          } else {
            term.writeln("\x1b[1;31mNo more hints.\x1b[0m");
          }
          term.write("\x1b[1;32m$ \x1b[0m"); return;
        }
        if (cmd === "flag") {
          term.writeln("\x1b[1;36mUse the flag input box on the left sidebar to submit your flag.\x1b[0m");
          term.write("\x1b[1;32m$ \x1b[0m"); return;
        }

        try {
          const res = await fetch(`${API}/campaigns/${id}/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ command: cmd })
          });
          const data = await res.json();
          attemptsRef.current += 1;
          setAttempts(attemptsRef.current);
          if (data.output) {
            (data.output || "").split('\n').forEach(line => term.writeln(line));
          }
          if (data.flag) {
            term.writeln("");
            term.writeln(`\x1b[1;33m  FLAG: ${data.flag}\x1b[0m`);
            term.writeln("\x1b[1;32m  Submit this flag in the left panel!\x1b[0m");
            setFlagInput(data.flag);
          }
        } catch {
          term.writeln("\x1b[1;31m[ERROR] Network error\x1b[0m");
        }
        term.write("\x1b[1;32m$ \x1b[0m");
      } else if (code === 127) {
        if (currentLine.current.length > 0) {
          currentLine.current = currentLine.current.slice(0, -1);
          term.write("\b \b");
        }
      } else if (code < 32) {
        // ignore
      } else {
        currentLine.current += data;
        term.write(data);
      }
    });

    window.addEventListener('resize', () => fit.fit());
    return () => { term.dispose(); terminalRef.current = null; };
  }, [loading, currentStage]);

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
          </div>
        </div>

        {stages.map(s => (
          <div key={s.id} style={{ margin: '0 1rem 0.75rem', padding: '0.75rem', background: s.current ? 'rgba(0,255,204,0.08)' : s.completed ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.02)', border: s.current ? '1px solid #00ffcc' : '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', opacity: s.unlocked ? 1 : 0.4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#fff' }}>S{s.order}: {s.title}</span>
              <span style={{ fontSize: '0.65rem', color: '#888' }}>{s.category}</span>
            </div>
            {s.completed && <span style={{ color: '#00ff88', fontSize: '0.7rem' }}>✓ Done</span>}
            {s.current && <span style={{ color: '#00ffcc', fontSize: '0.7rem' }}>▶ Current</span>}
          </div>
        ))}

        {currentStage && (
          <div className="flag-submit-box">
            <label className="flag-label">Submit Stage {currentStage.order} Flag</label>
            <input className="flag-input" placeholder="FLAG{...}" value={flagInput} onChange={e => { setFlagInput(e.target.value); setMsg(""); }} onKeyDown={e => e.key === "Enter" && submitFlag()} />
            <button className="flag-btn" onClick={submitFlag}>SUBMIT</button>
            {msg && <div className={`flag-feedback ${msg.includes('✅') ? 'success' : 'error'}`}>{msg}</div>}
          </div>
        )}

        <div className="sidebar-hints">
          <button className="hints-toggle" onClick={() => setShowHints(!showHints)}>
            {showHints ? "▾" : "▸"} HINTS ({currentStage?.hints?.length || 0} available)
          </button>
          {showHints && currentStage && (
            <div className="hints-list">
              {currentStage.hints.map((hint, i) => (
                <div key={i} className={`hint-item ${i < hintsUsed ? "revealed" : "locked"}`}>
                  {i < hintsUsed ? <><span className="hint-num">#{i + 1}</span> {hint}</> : <><span className="hint-num">#{i + 1}</span> 🔒 Type 'hint' in terminal</>}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="player-terminal-area">
        <div ref={termRef} className="xterm-container" />
      </div>
    </div>
  );
      }
