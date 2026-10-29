import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import LanguageSelector from "./LanguageSelector";
import { Icon } from "./Icon";
import "./Sidebar.css";

const navItems = [
  { path: "/", label: "Dashboard", icon: "home" },
  { path: "/learn", label: "Learn", icon: "path" },
  { path: "/flashcards", label: "Flashcards", icon: "cards" },
  { path: "/translator", label: "Translator", icon: "translate" },
  { path: "/favorites", label: "Favorites", icon: "star" },
];

// Position of the current page in the nav (-1 if none), matched like NavLink.
const activeIndex = (pathname) =>
  navItems.findIndex((item) =>
    item.path === "/"
      ? pathname === "/"
      : pathname === item.path || pathname.startsWith(`${item.path}/`),
  );

function Sidebar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const active = activeIndex(pathname);
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
            <Icon name="logout" />
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

        <nav
          className="sidebar-nav"
          aria-label="Main"
          style={{ "--active": active, "--count": navItems.length }}
        >
          {/* One marker for the whole nav, so it can slide to the current page. */}
          {active >= 0 && <span className="nav-indicator" aria-hidden="true" />}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <Icon name={item.icon} className="nav-icon" />
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
            <Icon name="logout" size={18} /> Log out
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
