import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-logo">
          <h1>Glossia</h1>
          <p>Your language learning companion</p>
        </div>
        {error && <p className="auth-error">{error}</p>}
        <div className="auth-fields">
          <input name="email" placeholder="Email" onChange={handleChange} />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
          />
        </div>
        <button className="auth-btn" onClick={handleSubmit}>
          Login
        </button>
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        <div className="auth-divider">
          <span>or</span>
        </div>
        <button
          className="google-btn"
          onClick={() => {
            window.location.replace("http://localhost:3000/api/auth/google");
          }}
        >
          <img src="https://www.google.com/favicon.ico" width="18" />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default Login;
