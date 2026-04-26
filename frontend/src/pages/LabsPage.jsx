import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LabsPage.css";

const API = "https://maqelepo.pythonanywhere.com/api";

const DIFF_CONFIG = {
  Easy:   { color: "#10b981", icon: "▲", label: "EASY" },
  Medium: { color: "#f59e0b", icon: "▲▲", label: "MEDIUM" },
  Hard:   { color: "#ef4444", icon: "▲▲▲", label: "HARD" },
};

const CAT_ICONS = {
  Network: "◉",
  "Brute Force": "⚡",
  Web: "⬡",
  Crypto: "◈",
  Forensics: "▲",
  Reverse: "◐",
};

export default function LabsPage() {
  const [labs, setLabs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/labs`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(d => { setLabs(d.labs || []); setFiltered(d.labs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = labs;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(s) ||
        l.description.toLowerCase().includes(s) ||
        l.category.toLowerCase().includes(s)
      );
    }
    if (diffFilter !== "All") result = result.filter(l => l.difficulty === diffFilter);
    if (catFilter !== "All") result = result.filter(l => l.category === catFilter);
    setFiltered(result);
  }, [search, diffFilter, catFilter, labs]);

  const categories = ["All", ...new Set(labs.map(l => l.category))];
  const difficulties = ["All", "Easy", "Medium", "Hard"];

  const getStatus = (lab) => {
    if (!lab.user_progress) return "locked";
    if (lab.user_progress.completed) return "completed";
    if (lab.user_progress.attempts > 0) return "in-progress";
    return "unlocked";
  };

  if (loading) return (
    <div className="labs-loading">
      <div className="labs-spinner" />
      <span>Loading lab manifest...</span>
    </div>
  );

  return (
    <div className="labs-page">
      <header className="labs-header">
        <div className="labs-logo" onClick={() => navigate("/")}>
          <span>⬡</span>
          <span>CYBER<strong>LAB</strong></span>
        </div>
        <nav>
          <button onClick={() => navigate("/")}>DASHBOARD</button>
          <button onClick={() => navigate("/profile")}>PROFILE</button>
          <button className="logout-btn" onClick={() => { localStorage.clear(); navigate("/login"); }}>LOGOUT</button>
        </nav>
      </header>

      <main className="labs-main">
        <div className="labs-hero">
          <h1>Lab Manifest</h1>
          <p>Select a mission. Each lab is a contained environment — no collateral damage.</p>
          <div className="labs-stats-bar">
            <span>{labs.length} labs available</span>
            <span>·</span>
            <span>{labs.filter(l => l.user_progress?.completed).length} completed</span>
          </div>
        </div>

        {/* Filters */}
        <div className="labs-filters">
          <input
            className="labs-search"
            placeholder="Search labs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="filter-group">
            {difficulties.map(d => (
              <button
                key={d}
                className={`filter-btn ${diffFilter === d ? "active" : ""}`}
                style={diffFilter === d && d !== "All" ? { "--fc": DIFF_CONFIG[d]?.color } : {}}
                onClick={() => setDiffFilter(d)}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="filter-group">
            {categories.map(c => (
              <button
                key={c}
                className={`filter-btn ${catFilter === c ? "active" : ""}`}
                onClick={() => setCatFilter(c)}
              >
                {CAT_ICONS[c] || "◉"} {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="labs-empty">No labs match your filters.</div>
        ) : (
          <div className="labs-grid">
            {filtered.map(lab => {
              const diff = DIFF_CONFIG[lab.difficulty] || DIFF_CONFIG.Easy;
              const status = getStatus(lab);
              return (
                <div
                  key={lab.id}
                  className={`lab-card ${status}`}
                  style={{ "--diff-color": diff.color }}
                  onClick={() => navigate(`/labs/${lab.id}`)}
                >
                  <div className="lab-card-top">
                    <span className="lab-category-icon">{CAT_ICONS[lab.category] || "◉"}</span>
                    <div className="lab-badges">
                      <span className="lab-diff-badge" style={{ color: diff.color, borderColor: diff.color }}>
                        {diff.icon} {diff.label}
                      </span>
                      {status === "completed" && <span className="lab-status-badge completed">✓ DONE</span>}
                      {status === "in-progress" && <span className="lab-status-badge inprogress">▶ ACTIVE</span>}
                    </div>
                  </div>

                  <h3 className="lab-title">{lab.title}</h3>
                  <p className="lab-desc">{lab.description}</p>

                  <div className="lab-card-footer">
                    <span className="lab-category">{lab.category}</span>
                    <span className="lab-points">{lab.points} pts</span>
                  </div>

                  {lab.user_progress?.completed && (
                    <div className="lab-completed-overlay">
                      <span>✓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
