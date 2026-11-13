import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { AuthShell, PasswordInput, PasswordRules } from "../components/AuthShell";
import { errorMessage } from "../lib/utils";
import { meetsPasswordRules } from "../lib/passwordRules";
import { reloadAt } from "../lib/navigation";

// The emailed link is /reset-password#token=…
const tokenFromHash = () => new URLSearchParams(window.location.hash.slice(1)).get("token") || "";

function ResetPassword() {
  const [token] = useState(tokenFromHash);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(token ? "" : "This link is incomplete. Ask for a new one.");

  // Out of the address bar and the history once read.
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      // A fresh page: every session, this browser's included, just ended.
      reloadAt("/login?reset=1");
    } catch (err) {
      setError(errorMessage(err, "Couldn't reach the server. Try again."));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell subtitle="Choose a new password">
      {error && (
        <div className="alert alert-error" role="alert">
          <p>{error}</p>
          {/* The button waits for a valid password, so errors are about the link. */}
          <p>
            <Link to="/forgot-password">Get a new link</Link>
          </p>
        </div>
      )}

      {token && (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="password">New password</label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={72}
              aria-describedby="password-rules"
              show={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
              autoFocus
            />
            <PasswordRules id="password-rules" password={password} />
          </div>
          <p className="auth-intro">You'll be logged out everywhere, then log in with the new password.</p>
          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={submitting || !meetsPasswordRules(password)}
          >
            {submitting ? "Saving…" : "Set new password"}
          </button>
        </form>
      )}

      <p className="auth-link">
        <Link to="/login">Back to log in</Link>
      </p>
    </AuthShell>
  );
}

export default ResetPassword;
