import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const API = "https://maqelepo-cyber-lab-platform-production.up.railway.app/api";
export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch {
      setError("Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⬡ CYBER<strong>LAB</strong></div>
        <h1 className="auth-title">Operator Login</h1>
        <p className="auth-sub">Enter your credentials to access the lab environment</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label>Username or Email</label>
          <input
            type="text" placeholder="username or email"
            value={form.username}
            onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
        </div>
        <div className="auth-field">
          <label>Password</label>
          <input
            type="password" placeholder="••••••••"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
        </div>

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Authenticating..." : "LOGIN"}
        </button>

        <p className="auth-link">
          No account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}
