import { NavLink } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import LanguageSelector from "./LanguageSelector";
import "./Sidebar.css";

const navItems = [
  { path: "/", label: "Dashboard", icon: "🏠" },
  { path: "/learn", label: "Learn", icon: "🎯" },
  { path: "/flashcards", label: "Flashcards", icon: "🃏" },
  { path: "/translator", label: "Translator", icon: "🔤" },
  { path: "/favorites", label: "Favorites", icon: "⭐" },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const initial = (user?.username || "?").charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile-only top bar: logo, language and logout */}
      <header className="mobile-topbar">
        <span className="sidebar-logo-text gradient-text">Glossia</span>
        <div className="mobile-topbar-actions">
          <LanguageSelector />
          <button
            className="icon-btn"
            onClick={logout}
            aria-label="Log out"
            title="Log out"
          >
            🚪
          </button>
        </div>
      </header>

      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-text gradient-text">Glossia</span>
          <span className="sidebar-version">v2</span>
        </div>

        <div className="sidebar-lang">
          <span className="sidebar-label">Learning</span>
          <LanguageSelector />
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar" aria-hidden="true">
              {initial}
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-username">{user?.username}</p>
              <p className="sidebar-email">{user?.email}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <span aria-hidden="true">🚪</span> Log out
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
