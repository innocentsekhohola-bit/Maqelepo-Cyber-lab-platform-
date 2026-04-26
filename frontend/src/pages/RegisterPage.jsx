import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const API = "http://localhost:5000/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">CYBERLAB</div>
        <h1 className="auth-title">Create Account</h1>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-field">
          <label>Username</label>
          <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
        </div>
        <div className="auth-field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
        </div>
        <div className="auth-field">
          <label>Password</label>
          <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
        </div>

        <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating..." : "REGISTER"}
        </button>

        <p className="auth-link"><Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}