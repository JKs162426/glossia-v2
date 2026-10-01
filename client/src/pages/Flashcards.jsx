import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { useLanguage } from "../context/language-context";
import { useApi } from "../hooks/useApi";
import { baseLanguageFor, getLanguage } from "../lib/languages";
import { canSpeak, speak } from "../lib/speech";
import { shuffle } from "../lib/utils";
import Loader from "../components/Loader";
import "./Flashcards.css";

// Normalizes both deck sources to { id, term, meaning }:
// term = language being learned, meaning = reference language.
const toDeck = (deckId, data) =>
  deckId === "favorites"
    ? {
        name: "My favorites",
        icon: "⭐",
        categoryId: null,
        cards: data.map((f) => ({ id: f.id, term: f.word, meaning: f.translation })),
      }
    : {
        name: data.category.name,
        icon: data.category.icon,
        categoryId: data.category.id,
        cards: data.cards,
      };

function DeckSession({ deck, language }) {
  const target = getLanguage(language);
  const base = getLanguage(baseLanguageFor(language));

  const [cards, setCards] = useState(() => shuffle(deck.cards));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState([]);
  const [showTermFirst, setShowTermFirst] = useState(true);
  const [xp, setXp] = useState(null);

  const finished = index >= cards.length;
  const card = cards[index];
  const front = showTermFirst
    ? { text: card?.term, lang: target }
    : { text: card?.meaning, lang: base };
  const back = showTermFirst
    ? { text: card?.meaning, lang: base }
    : { text: card?.term, lang: target };

  const flip = useCallback(() => setFlipped((f) => !f), []);

  const answer = useCallback(
    (correct) => {
      if (!flipped || finished) return;
      const nextResults = [...results, { ...card, correct }];
      setResults(nextResults);
      setFlipped(false);
      setIndex((i) => i + 1);

      if (nextResults.length === cards.length) {
        api
          .post("/flashcards/sessions", {
            language,
            categoryId: deck.categoryId,
            results: nextResults.map((r) => ({ word: r.term, correct: r.correct })),
          })
          .then((res) => setXp(res.data.xp))
          .catch(() => setXp(0));
      }
    },
    [flipped, finished, results, card, cards.length, language, deck.categoryId],
  );

  const restart = (subset) => {
    setCards(shuffle(subset));
    setIndex(0);
    setFlipped(false);
    setResults([]);
    setXp(null);
  };

  useEffect(() => {
    if (finished) return;
    const onKey = (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        flip();
      } else if (e.key === "ArrowLeft" || e.key === "1") {
        answer(false);
      } else if (e.key === "ArrowRight" || e.key === "2") {
        answer(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, flip, answer]);

  if (finished) {
    const correct = results.filter((r) => r.correct).length;
    const missed = results.filter((r) => !r.correct);
    const pct = Math.round((correct / results.length) * 100);

    return (
      <div className="card results-card">
        <span className="results-emoji" aria-hidden="true">
          {pct === 100 ? "🏆" : pct >= 70 ? "🎉" : "💪"}
        </span>
        <h2>Session complete!</h2>
        <p className="score gradient-text">
          {correct} / {results.length}
        </p>
        <div className="progress score-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        {xp !== null && xp > 0 && <p className="xp-earned">+{xp} XP</p>}

        {missed.length > 0 && (
          <div className="missed">
            <h3>Review these</h3>
            <ul>
              {missed.map((m) => (
                <li key={m.id}>
                  <strong>{m.term}</strong>
                  <span>{m.meaning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="results-actions">
          {missed.length > 0 && (
            <button className="btn btn-primary" onClick={() => restart(missed)}>
              Practice missed ({missed.length})
            </button>
          )}
          <button
            className={`btn ${missed.length ? "btn-secondary" : "btn-primary"}`}
            onClick={() => restart(deck.cards)}
          >
            Restart deck
          </button>
          <Link to="/flashcards" className="btn btn-secondary">
            Other decks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="deck-toolbar">
        <div className="progress deck-progress">
          <div
            className="progress-fill"
            style={{ width: `${(index / cards.length) * 100}%` }}
          />
        </div>
        <span className="deck-position">
          {index + 1} / {cards.length}
        </span>
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => {
            setShowTermFirst((s) => !s);
            setFlipped(false);
          }}
          title="Switch which side is shown first"
        >
          ⇄ {showTermFirst ? `${target.flag} → ${base.flag}` : `${base.flag} → ${target.flag}`}
        </button>
      </div>

      {/* key: a fresh element per card, so the flip-back animation can't
          briefly reveal the next card's answer */}
      <div
        key={index}
        className={`flashcard ${flipped ? "flipped" : ""}`}
        onClick={flip}
        role="button"
        tabIndex={0}
        aria-label={flipped ? `Answer: ${back.text}` : `${front.text}. Press space to reveal`}
      >
        <div className="flashcard-inner">
          <div className="flashcard-face flashcard-front">
            <span className="badge">
              {front.lang.flag} {front.lang.label}
            </span>
            <h2>{front.text}</h2>
            <span className="card-hint">Tap or press Space to reveal</span>
          </div>
          <div className="flashcard-face flashcard-back">
            <span className="badge">
              {back.lang.flag} {back.lang.label}
            </span>
            <h2>{back.text}</h2>
            <span className="card-hint">Did you know it?</span>
          </div>
        </div>
      </div>

      <div className="card-actions">
        {canSpeak && (
          <button
            className="btn btn-secondary"
            onClick={() => speak(card.term, language)}
            aria-label={`Listen to ${card.term}`}
          >
            🔊
          </button>
        )}
        <button className="btn btn-error" onClick={() => answer(false)} disabled={!flipped}>
          ✗ Still learning <kbd>←</kbd>
        </button>
        <button className="btn btn-success" onClick={() => answer(true)} disabled={!flipped}>
          ✓ Got it <kbd>→</kbd>
        </button>
      </div>
    </>
  );
}

function Flashcards() {
  const { deckId } = useParams();
  const { targetLanguage } = useLanguage();
  const path =
    deckId === "favorites"
      ? `/favorites?language=${targetLanguage}`
      : `/categories/${deckId}/deck?language=${targetLanguage}`;
  const { data, loading, error } = useApi(path);
  const deck = data && toDeck(deckId, data);

  return (
    <div className="page page-narrow flashcards">
      <header className="page-header">
        <div>
          <Link to="/flashcards" className="back-link">
            ← All decks
          </Link>
          <h1>
            {deck ? `${deck.name} ${deck.icon}` : "Flashcards"}
          </h1>
        </div>
      </header>

      {loading && <Loader label="Shuffling cards…" />}
      {error && <p className="alert alert-error">{error}</p>}

      {deck && deck.cards.length === 0 && (
        <div className="card empty-state">
          <span className="empty-icon">🗂️</span>
          <p>
            {deckId === "favorites"
              ? `You haven't saved any ${getLanguage(targetLanguage).label} words yet.`
              : "This deck has no cards for this language yet."}
          </p>
          <Link
            to={deckId === "favorites" ? "/translator" : "/flashcards"}
            className="btn btn-primary"
            style={{ marginTop: 16 }}
          >
            {deckId === "favorites" ? "Open translator" : "Choose another deck"}
          </Link>
        </div>
      )}

      {deck && deck.cards.length > 0 && (
        <DeckSession key={`${deckId}-${targetLanguage}`} deck={deck} language={targetLanguage} />
      )}
    </div>
  );
}

export default Flashcards;
