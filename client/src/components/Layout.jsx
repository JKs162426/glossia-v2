import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import Sidebar from "./Sidebar";
import Loader from "./Loader";
import "./Layout.css";

export function ProtectedLayout({ bare = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullscreen />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (bare) return <Outlet />;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

// Login/register pages: send already-authenticated users to the app.
export function PublicOnly() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader fullscreen />;
  const destination = location.state?.from || "/";
  return user ? <Navigate to={destination} replace /> : <Outlet />;
}
