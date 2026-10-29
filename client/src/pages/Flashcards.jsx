import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { useLanguage } from "../context/language-context";
import { useApi } from "../hooks/useApi";
import { baseLanguageFor, getLanguage } from "../lib/languages";
import { canSpeak, speak } from "../lib/speech";
import { shuffle } from "../lib/utils";
import Loader from "../components/Loader";
import { Icon, LanguageMark } from "../components/Icon";
import { SpeakerIcon } from "../components/SpeakerIcon";
import "./Flashcards.css";

// Normalizes both deck sources to { id, term, meaning }:
// term = language being learned, meaning = reference language.
const toDeck = (deckId, data) =>
  deckId === "favorites"
    ? {
        name: "My favorites",
        icon: "star",
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
  // The card just answered, flying out left ("still learning") or right ("got it").
  const [leaving, setLeaving] = useState(null);

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
      setLeaving({ id: index, card, correct });
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
    [flipped, finished, results, card, index, cards.length, language, deck.categoryId],
  );

  const restart = (subset) => {
    setCards(shuffle(subset));
    setIndex(0);
    setFlipped(false);
    setResults([]);
    setXp(null);
    setLeaving(null);
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
        <span className="icon-tile icon-tile-xl results-emoji">
          <Icon name={pct === 100 ? "trophy" : pct >= 70 ? "sparkles" : "target"} size={44} />
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
          <Icon name="swap" size={16} />
          <LanguageMark code={(showTermFirst ? target : base).code} size="sm" />
          <Icon name="arrow-right" size={14} />
          <LanguageMark code={(showTermFirst ? base : target).code} size="sm" />
          <span className="sr-only">
            Showing {(showTermFirst ? target : base).label} first. Switch direction
          </span>
        </button>
      </div>

      <div className="flashcard-stage">
        {leaving && (
          <div
            key={leaving.id}
            className={`flashcard-leaving ${leaving.correct ? "known" : "missed"}`}
            onAnimationEnd={() => setLeaving(null)}
            aria-hidden="true"
          >
            <div className="flashcard-face flashcard-back">
              <span className="badge">{back.lang.label}</span>
              <h2>{showTermFirst ? leaving.card.meaning : leaving.card.term}</h2>
            </div>
          </div>
        )}

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
              <span className="badge">{front.lang.label}</span>
              <h2>{front.text}</h2>
              <span className="card-hint">Tap or press Space to reveal</span>
            </div>
            <div className="flashcard-face flashcard-back">
              <span className="badge">{back.lang.label}</span>
              <h2>{back.text}</h2>
              <span className="card-hint">Did you know it?</span>
            </div>
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
            <SpeakerIcon text={card.term} />
          </button>
        )}
        <button className="btn btn-error" onClick={() => answer(false)} disabled={!flipped}>
          <Icon name="close" size={18} /> Still learning{" "}
          <kbd>
            <Icon name="arrow-left" size={12} label="Left arrow key" />
          </kbd>
        </button>
        <button className="btn btn-success" onClick={() => answer(true)} disabled={!flipped}>
          <Icon name="check" size={18} /> Got it{" "}
          <kbd>
            <Icon name="arrow-right" size={12} label="Right arrow key" />
          </kbd>
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
            <Icon name="arrow-left" size={14} /> All decks
          </Link>
          <h1 className="deck-title">
            {deck && (
              <span className="icon-tile">
                <Icon name={deck.icon} size={22} />
              </span>
            )}
            {deck ? deck.name : "Flashcards"}
          </h1>
        </div>
      </header>

      {loading && <Loader label="Shuffling cards…" />}
      {error && <p className="alert alert-error">{error}</p>}

      {deck && deck.cards.length === 0 && (
        <div className="card empty-state">
          <span className="icon-tile icon-tile-lg empty-icon">
            <Icon name="cards" size={26} />
          </span>
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
