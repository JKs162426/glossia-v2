import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { API_URL } from "../services/api";
import { useAuth } from "../context/auth-context";
import { PasswordInput } from "../components/AuthShell";
import { errorMessage } from "../lib/utils";
import "./Account.css";

function Account() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [needsGoogle, setNeedsGoogle] = useState(false);

  const cancel = () => {
    setConfirming(false);
    setPassword("");
    setError("");
    setNeedsGoogle(false);
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.delete("/users/me", { data: user.has_password ? { password } : {} });
      navigate("/login?deleted=1", { replace: true });
      setUser(null);
    } catch (err) {
      setNeedsGoogle(Boolean(err.response?.data?.reauth));
      setError(errorMessage(err, "Couldn't delete your account. Try again."));
      setSubmitting(false);
    }
  };

  return (
    <div className="page page-narrow account">
      <header className="page-header">
        <div>
          <h1>Account</h1>
          <p>Your profile and how you sign in.</p>
        </div>
      </header>

      <section className="card account-profile" aria-label="Profile">
        <div className="avatar avatar-lg" aria-hidden="true">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="account-profile-info">
          <p className="account-username">{user.username}</p>
          <p className="account-email">{user.email}</p>
          <p className="account-method">
            {user.has_password ? "Signs in with email and password" : "Signs in with Google"}
          </p>
        </div>
      </section>

      <section className="card danger-zone" aria-labelledby="delete-title">
        <h2 id="delete-title">Delete account</h2>
        <p className="danger-text">
          Your lessons, stars, XP, streak, flashcard history and favorites are deleted for good.
          There's no undo.
        </p>

        {!confirming ? (
          <button className="btn btn-error" type="button" onClick={() => setConfirming(true)}>
            Delete account…
          </button>
        ) : (
          <form className="danger-form" onSubmit={deleteAccount} noValidate>
            {user.has_password ? (
              <div className="field">
                <label htmlFor="delete-password">Enter your password to confirm</label>
                <PasswordInput
                  id="delete-password"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  show={showPassword}
                  onToggle={() => setShowPassword((s) => !s)}
                  autoFocus
                />
              </div>
            ) : (
              <p className="danger-text">
                You signed in with Google, so there's no password to enter. If it's been more
                than 10 minutes, we'll ask you to sign in with Google again first.
              </p>
            )}

            {error && (
              <div className="alert alert-error" role="alert">
                <p>{error}</p>
                {needsGoogle && (
                  <p>
                    <a href={`${API_URL}/auth/google`}>Sign in with Google</a>, then come back to
                    this page.
                  </p>
                )}
              </div>
            )}

            <div className="danger-actions">
              <button className="btn btn-ghost" type="button" onClick={cancel}>
                Keep my account
              </button>
              <button
                className="btn btn-error"
                type="submit"
                disabled={submitting || (user.has_password && !password)}
              >
                {submitting ? "Deleting…" : "Delete my account forever"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default Account;
