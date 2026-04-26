import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./LabPlayer.css";

const API = "https://maqelepo-cyber-lab-platform-production.up.railway.app/api";

const MOTD = [
  "  ╔═══════════════════════════════════════╗",
  "  ║         CYBER LAB TERMINAL v2.0       ║",
  "  ║   Type 'help' for available commands  ║",
  "  ╚═══════════════════════════════════════╝",
  "",
];

export default function LabPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [termLines, setTermLines] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [executing, setExecuting] = useState(false);
  const [flagInput, setFlagInput] = useState("");
  const [flagStatus, setFlagStatus] = useState(null); // null | "success" | "error"
  const [flagMsg, setFlagMsg] = useState("");
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const termRef = useRef(null);
  const inputRef = useRef(null);

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
        const welcome = [
          ...MOTD,
          `  Lab: ${d.lab.title}`,
          `  Category: ${d.lab.category}  |  Difficulty: ${d.lab.difficulty}  |  Points: ${d.lab.points}`,
          "",
          ...d.lab.instructions.split('\n').map(l => `  ${l}`),
          "",
          `  Allowed commands: ${(d.lab.allowed_commands || []).join(', ')}`,
          "",
        ].map(text => ({ type: "system", text }));
        setTermLines(welcome);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [termLines]);

  const addLines = useCallback((lines, type = "output") => {
    setTermLines(prev => [
      ...prev,
      ...lines.map(text => ({ type, text }))
    ]);
  }, []);

  const handleCommand = useCallback(async (raw) => {
    const cmd = raw.trim();
    if (!cmd) return;

    // Add to history
    setHistory(prev => [cmd, ...prev.slice(0, 49)]);
    setHistIdx(-1);

    // Echo command
    addLines([`$ ${cmd}`], "input");

    if (cmd === "clear") {
      setTermLines([]);
      return;
    }

    if (cmd === "help") {
      addLines([
        "Available commands:",
        ...(lab?.allowed_commands || []).map(c => `  ${c}`),
        "",
        "Special:",
        "  clear    Clear the terminal",
        "  hint     Show next hint (-10 pts each)",
        "  attempts Show attempt count",
        "",
      ]);
      return;
    }

    if (cmd === "attempts") {
      addLines([`Attempts: ${attempts}`]);
      return;
    }

    if (cmd === "hint") {
      await getHint();
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      addLines(["[ERROR] You must be logged in to execute commands."], "error");
      return;
    }

    setExecuting(true);
    try {
      const res = await fetch(`${API}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lab_id: parseInt(id), command: cmd })
      });
      const data = await res.json();
      setAttempts(data.attempts || attempts + 1);

      if (data.blocked) {
        addLines([data.output || "Command blocked."], "error");
      } else {
        const outLines = (data.output || "").split('\n');
        addLines(outLines, data.success ? "success" : "output");

        if (data.flag) {
          addLines([
            "",
            "══════════════════════════════════",
            `  FLAG FOUND: ${data.flag}`,
            "  Submit it in the flag box below!",
            "══════════════════════════════════",
            "",
          ], "flag");
          setFlagInput(data.flag);
        }
      }
    } catch {
      addLines(["[ERROR] Network error. Is the backend running?"], "error");
    } finally {
      setExecuting(false);
    }
  }, [lab, id, attempts, addLines]);

  const getHint = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { addLines(["[ERROR] Login required."], "error"); return; }

    const res = await fetch(`${API}/use-hint`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ lab_id: parseInt(id), hint_index: hintsUsed })
    });
    const data = await res.json();
    if (data.error) {
      addLines([`[HINT] ${data.error}`], "error");
    } else {
      setHintsUsed(data.hints_used);
      addLines([
        `[HINT ${data.hints_used}] ${data.hint}`,
        `  (Penalty: -${data.point_penalty} pts from final score)`,
        "",
      ], "hint");
    }
  }, [id, hintsUsed, addLines]);

  const submitFlag = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) { setFlagStatus("error"); setFlagMsg("Login required"); return; }
    if (!flagInput.trim()) return;

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
      addLines([
        "",
        "🎉 " + (data.message || "Lab complete!"),
        `   Points earned: ${data.points_earned}`,
        `   Total points:  ${data.total_points}`,
        `   Rank:          ${data.rank}`,
        "",
      ], "success");
    } else {
      setFlagStatus("error");
      setFlagMsg(data.error || "Incorrect flag. Keep trying!");
    }
  }, [flagInput, id, addLines]);

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCommand(inputVal);
      setInputVal("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = histIdx + 1;
      if (idx < history.length) { setHistIdx(idx); setInputVal(history[idx]); }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = histIdx - 1;
      if (idx >= 0) { setHistIdx(idx); setInputVal(history[idx]); }
      else { setHistIdx(-1); setInputVal(""); }
    }
  };

  if (loading) return (
    <div className="player-loading">
      <div className="player-spinner" />
      <span>Initializing lab environment...</span>
    </div>
  );

  if (!lab) return <div className="player-error">Lab not found.</div>;

  const DIFF_COLORS = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" };
  const diffColor = DIFF_COLORS[lab.difficulty] || "#10b981";

  return (
    <div className="player-page">
      {/* Sidebar */}
      <aside className="player-sidebar">
        <div className="player-sidebar-top">
          <button className="back-btn" onClick={() => navigate("/labs")}>← LABS</button>

          <div className="sidebar-lab-info">
            <div className="sidebar-diff" style={{ color: diffColor, borderColor: diffColor }}>
              {lab.difficulty.toUpperCase()}
            </div>
            <h2 className="sidebar-title">{lab.title}</h2>
            <p className="sidebar-desc">{lab.description}</p>
          </div>

          <div className="sidebar-meta">
            <div className="meta-row">
              <span className="meta-label">Category</span>
              <span className="meta-val">{lab.category}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Points</span>
              <span className="meta-val" style={{ color: "#ffcc00" }}>{lab.points}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Attempts</span>
              <span className="meta-val">{attempts}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">Status</span>
              <span className="meta-val" style={{ color: completed ? "#00ff88" : "#f59e0b" }}>
                {completed ? "✓ COMPLETE" : "IN PROGRESS"}
              </span>
            </div>
          </div>
        </div>

        {/* Hints */}
        <div className="sidebar-hints">
          <button className="hints-toggle" onClick={() => setShowHints(!showHints)}>
            {showHints ? "▾" : "▸"} HINTS ({(lab.hints || []).length} available)
          </button>
          {showHints && (
            <div className="hints-list">
              {(lab.hints || []).map((hint, i) => (
                <div key={i} className={`hint-item ${i < hintsUsed ? "revealed" : "locked"}`}>
                  {i < hintsUsed ? (
                    <><span className="hint-num">#{i + 1}</span> {hint}</>
                  ) : (
                    <><span className="hint-num">#{i + 1}</span> <span className="hint-locked">🔒 Use 'hint' in terminal (-10 pts)</span></>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flag submission */}
        <div className="flag-submit-box">
          <label className="flag-label">Submit Flag</label>
          <input
            className="flag-input"
            placeholder="FLAG{...}"
            value={flagInput}
            onChange={e => { setFlagInput(e.target.value); setFlagStatus(null); }}
            onKeyDown={e => e.key === "Enter" && submitFlag()}
            disabled={completed}
          />
          <button className="flag-btn" onClick={submitFlag} disabled={completed || !flagInput.trim()}>
            {completed ? "✓ COMPLETED" : "SUBMIT"}
          </button>
          {flagStatus && (
            <div className={`flag-feedback ${flagStatus}`}>{flagMsg}</div>
          )}
        </div>
      </aside>

      {/* Terminal */}
      <div className="player-terminal-area">
        <div className="term-titlebar">
          <div className="term-dots">
            <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
          </div>
          <span className="term-title">cyber-lab terminal — {lab.title}</span>
          <span className="term-status">{executing ? "⏳ executing..." : "● ready"}</span>
        </div>

        <div className="term-body" ref={termRef} onClick={() => inputRef.current?.focus()}>
          {termLines.map((line, i) => (
            <div key={i} className={`term-line ${line.type}`}>
              {line.text}
            </div>
          ))}

          {!completed && (
            <div className="term-input-row">
              <span className="term-prompt">$</span>
              <input
                ref={inputRef}
                className="term-input"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={executing}
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
              {executing && <span className="term-cursor blink">▋</span>}
            </div>
          )}

          {completed && (
            <div className="term-completed-banner">
              ✓ Lab Complete — Well done, operator.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
