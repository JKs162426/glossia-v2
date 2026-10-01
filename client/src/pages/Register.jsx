import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { AuthShell, GoogleButton, PasswordInput } from "../components/AuthShell";
import { errorMessage } from "../lib/utils";

// Mirrors the server-side rules in server/src/middleware/validators.js
const PASSWORD_RULES = [
  { label: "8+ characters", test: (p) => p.length >= 8 },
  { label: "A letter", test: (p) => /[a-zA-Z]/.test(p) },
  { label: "A number", test: (p) => /\d/.test(p) },
];
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/;

function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const passwordOk = PASSWORD_RULES.every((rule) => rule.test(form.password));
  const usernameOk = USERNAME_PATTERN.test(form.username);
  const usernameInvalid = form.username.length > 0 && !usernameOk;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // Once the user is set, PublicOnly takes them into the app.
      await register(form.username.trim(), form.email.trim(), form.password);
    } catch (err) {
      setError(errorMessage(err, "Couldn't reach the server. Try again."));
      setSubmitting(false);
    }
  };

  return (
    <AuthShell subtitle="Start your language journey">
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            className="input"
            autoComplete="username"
            placeholder="e.g. maria_92"
            value={form.username}
            onChange={handleChange}
            aria-invalid={usernameInvalid}
            aria-describedby="username-hint"
            maxLength={30}
            autoFocus
          />
          <small id="username-hint" className="password-rules">
            3–30 letters, numbers or underscores
          </small>
        </div>
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
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={form.password}
            onChange={handleChange}
            maxLength={72}
            aria-describedby="password-rules"
            show={showPassword}
            onToggle={() => setShowPassword((s) => !s)}
          />
          <ul id="password-rules" className="password-rules">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(form.password);
              return (
                <li key={rule.label} className={met ? "met" : ""}>
                  {met ? "✓" : "○"} {rule.label}
                </li>
              );
            })}
          </ul>
        </div>
        <button
          className="btn btn-primary btn-block"
          type="submit"
          disabled={submitting || !usernameOk || !form.email || !passwordOk}
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <GoogleButton />

      <p className="auth-link">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthShell>
  );
}

export default Register;
