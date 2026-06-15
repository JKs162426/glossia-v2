import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AuthCallback() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    const user = url.searchParams.get("user");

    if (token && user) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", decodeURIComponent(user));
      window.location.href = "/";
    } else {
      window.location.href = "/login";
    }
  }, []);

  return <p>Signing you in...</p>;
}

export default AuthCallback;
