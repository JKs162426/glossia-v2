import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";
import { AuthShell } from "../components/AuthShell";
import { errorMessage } from "../lib/utils";

function ForgotPassword() {
  const location = useLocation();
  // The login page passes along whatever was typed in its email field.
  const [email, setEmail] = useState(location.state?.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(data.message);
    } catch (err) {
      setError(errorMessage(err, "Couldn't reach the server. Try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell subtitle="Reset your password">
      {sent ? (
        <div className="alert alert-success" role="status">
          <p>{sent}</p>
          <p>The link works for 30 minutes. If it doesn't arrive, check your spam folder.</p>
        </div>
      ) : (
        <>
          <p className="auth-intro">
            Enter the email of your account and we'll send you a link to choose a new password.
          </p>
          {error && (
            <p className="alert alert-error" role="alert">
              {error}
            </p>
          )}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={submitting || !email.trim()}
            >
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </>
      )}

      <p className="auth-link">
        Remembered it? <Link to="/login">Back to log in</Link>
      </p>
    </AuthShell>
  );
}

export default ForgotPassword;
