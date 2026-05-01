import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import "./LabPlayer.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function LabPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [flagInput, setFlagInput] = useState("");
  const [flagStatus, setFlagStatus] = useState(null);
  const [flagMsg, setFlagMsg] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [mentorTip, setMentorTip] = useState("💡 I'll guide you through this lab. Type your first command!");
  const [commandHistory, setCommandHistory] = useState([]);
  
  const termRef = useRef(null);
  const terminalRef = useRef(null);
  const fitRef = useRef(null);
  const currentLine = useRef("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/labs/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(d => {
        setLab(d.lab);
        if (d.lab.user_progress) {
          setCompleted(d.lab.user_progress.completed);
          setAttempts(d.lab.user_progress.attempts);
          setHintsUsed(d.lab.user_progress.hints_used);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const getMentorTip = async (cmd) => {
    const token = localStorage.getItem("token");
    if (!token || !lab) return;
    try {
      const res = await fetch(`${API}/mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lab: lab.title, command: cmd, history: commandHistory })
      });
      const data = await res.json();
      setMentorTip(data.tip || "Keep going, you're doing great!");
    } catch {}
  };

  useEffect(() => {
    if (loading || !lab || terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Share Tech Mono', monospace",
      theme: {
        background: "#050a0f",
        foreground: "#c8d8e8",
        cursor: "#00ff88",
        green: "#00ff88",
        blue: "#00aaff",
        red: "#ef4444",
        yellow: "#ffcc00",
      },
      cols: 80,
      rows: 24,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(termRef.current);
    fit.fit();
    fitRef.current = fit;
    terminalRef.current = term;

    const welcome = [
      "\r\n\x1b[1;32m  ╔═══════════════════════════════════════╗\x1b[0m",
      "\x1b[1;32m  ║         CYBER LAB TERMINAL v3.0       ║\x1b[0m",
      "\x1b[1;32m  ║   Type 'help' for available commands  ║\x1b[0m",
      "\x1b[1;32m  ╚═══════════════════════════════════════╝\x1b[0m",
      "",
      `\x1b[1;36m  Lab: ${lab.title}\x1b[0m`,
      `  Category: ${lab.category}  |  Difficulty: ${lab.difficulty}  |  Points: ${lab.points}`,
      "",
      ...lab.instructions.split('\n').map(l => `  ${l}`),
      "",
      `  Allowed commands: ${(lab.allowed_commands || []).join(', ')}`,
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
        
        if (cmd === "clear") {
          term.clear();
          term.write("\x1b[1;32m$ \x1b[0m");
          return;
        }
        
        if (cmd === "help") {
          term.writeln("Available:");
          (lab.allowed_commands || []).forEach(c => term.writeln(`  ${c}`));
          term.writeln("  clear    Clear terminal");
          term.writeln("  hint     Show hint (-10 pts)");
          term.writeln("  attempts Show count");
          term.writeln("");
          term.write("\x1b[1;32m$ \x1b[0m");
          return;
        }
        
        if (cmd === "attempts") {
          term.writeln(`\x1b[1;33mAttempts: ${attempts}\x1b[0m`);
          term.write("\x1b[1;32m$ \x1b[0m");
          return;
        }
        
        if (cmd === "hint") {
          await getHint(term);
          term.write("\x1b[1;32m$ \x1b[0m");
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          term.writeln("\x1b[1;31m[ERROR] Login required.\x1b[0m");
          term.write("\x1b[1;32m$ \x1b[0m");
          return;
        }

        const newHistory = [...commandHistory, cmd];
        setCommandHistory(newHistory);
        getMentorTip(cmd);

        try {
          const res = await fetch(`${API}/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ lab_id: parseInt(id), command: cmd })
          });
          const data = await res.json();
          setAttempts(data.attempts || attempts + 1);

          if (data.blocked) {
            term.writeln(`\x1b[1;31m[BLOCKED] ${data.output}\x1b[0m`);
          } else {
            const outLines = (data.output || "").split('\n');
            outLines.forEach(line => term.writeln(line));
            
            if (data.flag) {
              term.writeln("");
              term.writeln("\x1b[1;33m══════════════════════════════════\x1b[0m");
              term.writeln(`\x1b[1;33m  FLAG FOUND: ${data.flag}\x1b[0m`);
              term.writeln("\x1b[1;33m  Submit in the flag box below!\x1b[0m");
              term.writeln("\x1b[1;33m══════════════════════════════════\x1b[0m");
              term.writeln("");
              setFlagInput(data.flag);
            }
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
    return () => term.dispose();
  }, [loading, lab, commandHistory]);

  const getHint = async (term) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/use-hint`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lab_id: parseInt(id), hint_index: hintsUsed })
    });
    const data = await res.json();
    if (data.error) {
      term.writeln(`\x1b[1;31m[HINT] ${data.error}\x1b[0m`);
    } else {
      setHintsUsed(data.hints_used);
      term.writeln(`\x1b[1;33m[HINT ${data.hints_used}] ${data.hint}\x1b[0m`);
      term.writeln(`  (Penalty: -${data.point_penalty} pts)`);
    }
  };

  const submitFlag = async () => {
    const token = localStorage.getItem("token");
    if (!token || !flagInput.trim()) return;
    const res = await fetch(`${API}/complete-lab`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lab_id: parseInt(id), flag: flagInput.trim() })
    });
    const data = await res.json();
    if (data.correct) {
      setFlagStatus("success");
      setFlagMsg(data.message || "Lab complete!");
      setCompleted(true);
      setMentorTip("🎉 Amazing work! Lab complete! You're a true hacker!");
    } else {
      setFlagStatus("error");
      setFlagMsg(data.error || "Incorrect flag");
    }
  };

  if (loading) return (
    <div className="player-loading"><div className="player-spinner" /><span>Initializing lab...</span></div>
  );
  if (!lab) return <div className="player-loading">Lab not found.</div>;

  const DIFF_COLORS = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" };
  const diffColor = DIFF_COLORS[lab.difficulty] || "#10b981";

  return (
    <div className="player-page">
      <aside className="player-sidebar">
        <div className="player-sidebar-top">
          <button className="back-btn" onClick={() => navigate("/labs")}>← LABS</button>
          <div className="sidebar-diff" style={{ color: diffColor, borderColor: diffColor }}>{lab.difficulty.toUpperCase()}</div>
          <h2 className="sidebar-title">{lab.title}</h2>
          <p className="sidebar-desc">{lab.description}</p>
          <div className="sidebar-meta">
            <div className="meta-row"><span className="meta-label">Category</span><span className="meta-val">{lab.category}</span></div>
            <div className="meta-row"><span className="meta-label">Points</span><span className="meta-val" style={{ color: "#ffcc00" }}>{lab.points}</span></div>
            <div className="meta-row"><span className="meta-label">Attempts</span><span className="meta-val">{attempts}</span></div>
            <div className="meta-row"><span className="meta-label">Status</span><span className="meta-val" style={{ color: completed ? "#00ff88" : "#f59e0b" }}>{completed ? "✓ COMPLETE" : "IN PROGRESS"}</span></div>
          </div>
        </div>

        <div className="mentor-panel">
          <div className="mentor-header">🧠 AI Mentor</div>
          <div className="mentor-tip">{mentorTip}</div>
        </div>

        <div className="sidebar-hints">
          <button className="hints-toggle" onClick={() => setShowHints(!showHints)}>
            {showHints ? "▾" : "▸"} HINTS ({(lab.hints || []).length} available)
          </button>
          {showHints && (
            <div className="hints-list">
              {(lab.hints || []).map((hint, i) => (
                <div key={i} className={`hint-item ${i < hintsUsed ? "revealed" : "locked"}`}>
                  {i < hintsUsed ? <><span className="hint-num">#{i + 1}</span> {hint}</> : <><span className="hint-num">#{i + 1}</span> 🔒 Use 'hint' in terminal</>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flag-submit-box">
          <label className="flag-label">Submit Flag</label>
          <input className="flag-input" placeholder="FLAG{...}" value={flagInput}
            onChange={e => { setFlagInput(e.target.value); setFlagStatus(null); }}
            onKeyDown={e => e.key === "Enter" && submitFlag()}
            disabled={completed} />
          <button className="flag-btn" onClick={submitFlag} disabled={completed || !flagInput.trim()}>
            {completed ? "✓ COMPLETED" : "SUBMIT"}
          </button>
          {flagStatus && <div className={`flag-feedback ${flagStatus}`}>{flagMsg}</div>}
        </div>
      </aside>

      <div className="player-terminal-area">
        <div ref={termRef} className="xterm-container" />
        {completed && <div className="term-completed-banner">✓ Lab Complete — Well done, operator.</div>}
      </div>
    </div>
  );
}
