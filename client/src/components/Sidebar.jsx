import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const navItems = [
  { path: "/", label: "Dashboard", icon: "🏠" },
  { path: "/flashcards", label: "Flashcards", icon: "🃏" },
  { path: "/translator", label: "Translator", icon: "🔤" },
  { path: "/favorites", label: "Favorites", icon: "⭐" },
];

function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Glossia</h1>
        <span>v2</span>
      </div>

      <div className="sidebar-user">
        <div className="avatar">{user?.username[0].toUpperCase()}</div>
        <p>{user?.username}</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="logout-btn" onClick={logout}>
        🚪 Logout
      </button>
    </aside>
  );
}

export default Sidebar;
