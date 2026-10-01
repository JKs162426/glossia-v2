import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useLanguage } from "../context/language-context";
import { useApi } from "../hooks/useApi";
import { getLanguage } from "../lib/languages";
import { canSpeak, speak } from "../lib/speech";
import Loader from "../components/Loader";
import "./Favorites.css";

function Favorites() {
  const { targetLanguage } = useLanguage();
  const { data: favorites, loading, error, setData } = useApi("/favorites");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const deleteFavorite = async (favorite) => {
    setDeleteError("");
    setData((list) => list.filter((f) => f.id !== favorite.id)); // optimistic
    try {
      await api.delete(`/favorites/${favorite.id}`);
    } catch {
      setData((list) => [favorite, ...list]);
      setDeleteError(`Couldn't remove “${favorite.word}”. Try again.`);
    }
  };

  const languagesInUse = [...new Set((favorites || []).map((f) => f.language))];
  const query = search.trim().toLowerCase();
  const visible = (favorites || []).filter(
    (f) =>
      (filter === "all" || f.language === filter) &&
      (!query ||
        f.word.toLowerCase().includes(query) ||
        f.translation.toLowerCase().includes(query)),
  );
  const practiceCount = (favorites || []).filter((f) => f.language === targetLanguage).length;
  const target = getLanguage(targetLanguage);

  return (
    <div className="page favorites">
      <header className="page-header">
        <div>
          <h1>Favorites ⭐</h1>
          <p>Words and phrases you've saved from the translator.</p>
        </div>
        {practiceCount > 0 && (
          <Link to="/flashcards/favorites" className="btn btn-primary">
            🃏 Practice {practiceCount} {target.label} {practiceCount === 1 ? "word" : "words"}
          </Link>
        )}
      </header>

      {loading && <Loader />}
      {error && <p className="alert alert-error">{error}</p>}
      {deleteError && <p className="alert alert-error favorites-alert">{deleteError}</p>}

      {favorites && favorites.length === 0 && (
        <div className="card empty-state">
          <span className="empty-icon">⭐</span>
          <p>No favorites yet. Translate something and save it!</p>
          <Link to="/translator" className="btn btn-primary favorites-cta">
            Open translator
          </Link>
        </div>
      )}

      {favorites && favorites.length > 0 && (
        <>
          <div className="favorites-toolbar">
            <input
              className="input favorites-search"
              type="search"
              placeholder="Search favorites…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search favorites"
            />
            {languagesInUse.length > 1 && (
              <div className="chips" role="group" aria-label="Filter by language">
                <button
                  className={`chip ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                  aria-pressed={filter === "all"}
                >
                  All
                </button>
                {languagesInUse.map((code) => (
                  <button
                    key={code}
                    className={`chip ${filter === code ? "active" : ""}`}
                    onClick={() => setFilter(code)}
                    aria-pressed={filter === code}
                  >
                    {getLanguage(code).flag} {getLanguage(code).label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {visible.length === 0 ? (
            <p className="empty-state">No favorites match your search.</p>
          ) : (
            <div className="favorites-grid">
              {visible.map((fav) => {
                const lang = getLanguage(fav.language);
                return (
                  <article key={fav.id} className="card card-interactive favorite-card">
                    <span className="badge">
                      {lang.flag} {lang.label}
                    </span>
                    <h3 lang={fav.language}>{fav.word}</h3>
                    <p>{fav.translation}</p>
                    <div className="favorite-actions">
                      {canSpeak && (
                        <button
                          className="icon-btn"
                          onClick={() => speak(fav.word, fav.language)}
                          aria-label={`Listen to ${fav.word}`}
                        >
                          🔊
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteFavorite(fav)}
                        aria-label={`Remove ${fav.word} from favorites`}
                      >
                        🗑 Remove
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Favorites;
