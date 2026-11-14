import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { AuthShell, GoogleButton, PasswordInput } from "../components/AuthShell";
import { errorMessage } from "../lib/utils";

const OAUTH_ERRORS = {
  google: "Google sign-in failed or was cancelled. Please try again.",
};

function Login() {
  const { login } = useAuth();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(OAUTH_ERRORS[params.get("error")] || "");
  // Set by the Account page after deleting the account, and by the reset
  // password page after a new password.
  const notice = params.get("deleted") === "1"
    ? "Your account and all its data were deleted."
    : params.get("reset") === "1"
      ? "Your password was changed. Log in with the new one."
      : "";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // PublicOnly redirects to location.state.from once the user is set.
      await login(form.email.trim(), form.password);
    } catch (err) {
      setError(errorMessage(err, "Couldn't reach the server. Try again."));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell subtitle="Your language learning companion">
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      {notice && !error && (
        <p className="alert alert-success" role="status">
          {notice}
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
            value={form.email}
            onChange={handleChange}
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={form.password}
            onChange={handleChange}
            required
            show={showPassword}
            onToggle={() => setShowPassword((s) => !s)}
          />
          <Link className="auth-forgot" to="/forgot-password" state={{ email: form.email.trim() }}>
            Forgot password?
          </Link>
        </div>
        <button
          className="btn btn-primary btn-block"
          type="submit"
          disabled={submitting || !form.email || !form.password}
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <GoogleButton />

      <p className="auth-link">
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
    </AuthShell>
  );
}

export default Login;
