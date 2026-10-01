import { Link } from "react-router-dom";
import { useLanguage } from "../context/language-context";
import { useApi } from "../hooks/useApi";
import { getLanguage } from "../lib/languages";
import Loader from "../components/Loader";
import "./CategorySelect.css";

function DeckCard({ to, icon, name, count }) {
  const empty = count === 0;
  const content = (
    <>
      <span className="deck-icon" aria-hidden="true">
        {icon}
      </span>
      <h3>{name}</h3>
      <span className="deck-count">{empty ? "No cards yet" : `${count} cards`}</span>
    </>
  );

  return empty ? (
    <div className="card deck-card disabled" aria-disabled="true">
      {content}
    </div>
  ) : (
    <Link to={to} className="card card-interactive deck-card">
      {content}
    </Link>
  );
}

function CategorySelect() {
  const { targetLanguage } = useLanguage();
  const language = getLanguage(targetLanguage);
  const categories = useApi(`/categories?language=${targetLanguage}`);
  const favorites = useApi(`/favorites?language=${targetLanguage}`);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Flashcards 🃏</h1>
          <p>
            Pick a deck to practice your {language.flag} {language.label} vocabulary.
          </p>
        </div>
      </header>

      {categories.loading && <Loader />}
      {categories.error && <p className="alert alert-error">{categories.error}</p>}

      {categories.data && (
        <>
          <h2 className="section-title">Your decks</h2>
          <div className="deck-grid deck-grid-personal">
            <DeckCard
              to="/flashcards/favorites"
              icon="⭐"
              name="My favorites"
              count={favorites.data?.length ?? 0}
            />
          </div>

          <h2 className="section-title">Topics</h2>
          <div className="deck-grid">
            {categories.data.map((cat) => (
              <DeckCard
                key={cat.id}
                to={`/flashcards/${cat.id}`}
                icon={cat.icon}
                name={cat.name}
                count={cat.word_count}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default CategorySelect;
