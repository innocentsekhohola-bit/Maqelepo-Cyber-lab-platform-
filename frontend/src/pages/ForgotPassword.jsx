import { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

const API = "https://maqelepo.pythonanywhere.com/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
    } catch {}
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⬡ CYBER<strong>LAB</strong></div>
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-sub">Enter your email and we'll send you a reset link</p>

        {sent ? (
          <div style={{ color: '#00ff88', textAlign: 'center', padding: '1rem' }}>
            If an account exists with that email, you'll receive a password reset link shortly.
          </div>
        ) : (
          <>
            <div className="auth-field">
              <label>Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
            </div>
            <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? "Sending..." : "SEND RESET LINK"}
            </button>
          </>
        )}

        <p className="auth-link">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
