import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import Loader from "../components/Loader";

// Google sign-in lands here after the API has set the session cookie.
function AuthCallback() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser().then((user) =>
      navigate(user ? "/" : "/login?error=google", { replace: true }),
    );
  }, [refreshUser, navigate]);

  return <Loader label="Signing you in…" fullscreen />;
}

export default AuthCallback;
