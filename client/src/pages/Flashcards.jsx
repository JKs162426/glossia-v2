import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import "./Flashcards.css";

function Flashcards() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { targetLanguage } = useLanguage();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState([]);

  const categoryName = location.state?.category?.name || "Flashcards";

  useEffect(() => {
    fetchWords();
  }, [id, targetLanguage]);

  const fetchWords = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/categories/${id}/words?language=${targetLanguage}`
      );
      setCards(res.data);
      setCurrent(0);
      setCompleted([]);
    } catch (error) {
      console.error("Error fetching words");
    }
    setLoading(false);
  };

  const handleFlip = () => setFlipped(!flipped);

  const handleNext = (correct) => {
    setCompleted([...completed, { ...cards[current], correct }]);
    setFlipped(false);
    setTimeout(() => {
      if (current + 1 < cards.length) {
        setCurrent(current + 1);
      } else {
        setCurrent(null);
      }
    }, 200);
  };

  const handleRestart = () => {
    setCurrent(0);
    setFlipped(false);
    setCompleted([]);
  };

  if (loading) {
    return (
      <div className="flashcards">
        <p className="empty-state">Loading words...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flashcards">
        <div className="flashcards-header">
          <h1>{categoryName} 🃏</h1>
        </div>
        <p className="empty-state">No words available for this language yet.</p>
        <button className="restart-btn" onClick={() => navigate("/flashcards")}>
          Choose Another Category
        </button>
      </div>
    );
  }

  if (current === null) {
    const correct = completed.filter((c) => c.correct).length;
    return (
      <div className="flashcards">
        <div className="flashcards-header">
          <h1>{categoryName} 🃏</h1>
        </div>
        <div className="results-card">
          <h2>Session Complete!</h2>
          <p className="score">
            {correct} / {cards.length} correct
          </p>
          <div className="score-bar">
            <div
              className="score-fill"
              style={{ width: `${(correct / cards.length) * 100}%` }}
            />
          </div>
          <div className="results-actions">
            <button className="restart-btn" onClick={handleRestart}>
              Try Again
            </button>
            <button
              className="secondary-btn"
              onClick={() => navigate("/flashcards")}
            >
              Choose Another Category
            </button>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[current];

  return (
    <div className="flashcards">
      <div className="flashcards-header">
        <h1>{categoryName} 🃏</h1>
        <p>
          {current + 1} of {cards.length}
        </p>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(current / cards.length) * 100}%` }}
        />
      </div>

      <div className={`card ${flipped ? "flipped" : ""}`} onClick={handleFlip}>
        <div className="card-inner">
          <div className="card-front">
            <span className="card-hint">Tap to reveal</span>
            <h2>{card.word}</h2>
            <span className="lang-badge">{card.language.toUpperCase()}</span>
          </div>
          <div className="card-back">
            <span className="card-hint">Translation</span>
            <h2>{card.translation}</h2>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="card-actions">
          <button className="wrong-btn" onClick={() => handleNext(false)}>
            ✗ Incorrect
          </button>
          <button className="correct-btn" onClick={() => handleNext(true)}>
            ✓ Correct
          </button>
        </div>
      )}
    </div>
  );
}

export default Flashcards;
