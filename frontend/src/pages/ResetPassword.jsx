import { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function ResetPassword() {
  const [form, setForm] = useState({ email: "", newPassword: "" });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      setDone(true);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⬡ CYBER<strong>LAB</strong></div>
        <h1 className="auth-title">Reset Password</h1>

        {done ? (
          <div style={{ color: '#00ff88', textAlign: 'center', padding: '1rem' }}>
            Password updated! <Link to="/login">Login here</Link>
          </div>
        ) : (
          <>
            {error && <div className="auth-error">{error}</div>}
            <div className="auth-field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="auth-field">
              <label>New Password</label>
              <input type="password" value={form.newPassword} onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))} />
            </div>
            <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? "Updating..." : "RESET PASSWORD"}
            </button>
          </>
        )}

        <p className="auth-link"><Link to="/login">Back to Login</Link></p>
      </div>
    </div>
  );
}
