import { useState } from "react";
import "./Flashcards.css";

const flashcardsData = [
  { id: 1, word: "Hello", translation: "Hola", language: "es" },
  { id: 2, word: "Goodbye", translation: "Adiós", language: "es" },
  { id: 3, word: "Thank you", translation: "Gracias", language: "es" },
  { id: 4, word: "Please", translation: "Por favor", language: "es" },
  { id: 5, word: "Sorry", translation: "Lo siento", language: "es" },
];

function Flashcards() {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState([]);

  const card = flashcardsData[current];

  const handleFlip = () => setFlipped(!flipped);

  const handleNext = (correct) => {
    setCompleted([...completed, { ...card, correct }]);
    setFlipped(false);
    setTimeout(() => {
      if (current + 1 < flashcardsData.length) {
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

  if (current === null) {
    const correct = completed.filter((c) => c.correct).length;
    return (
      <div className="flashcards">
        <div className="flashcards-header">
          <h1>Flashcards 🃏</h1>
        </div>
        <div className="results-card">
          <h2>Session Complete!</h2>
          <p className="score">
            {correct} / {flashcardsData.length} correct
          </p>
          <div className="score-bar">
            <div
              className="score-fill"
              style={{ width: `${(correct / flashcardsData.length) * 100}%` }}
            />
          </div>
          <button className="restart-btn" onClick={handleRestart}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcards">
      <div className="flashcards-header">
        <h1>Flashcards 🃏</h1>
        <p>
          {current + 1} of {flashcardsData.length}
        </p>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(current / flashcardsData.length) * 100}%` }}
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
