import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../context/language-context";
import { useApi } from "../hooks/useApi";
import api from "../services/api";
import { getLanguage } from "../lib/languages";
import { buildExercises, checkTyped } from "../lib/exercises";
import { canSpeak, speak } from "../lib/speech";
import { errorMessage, shuffle } from "../lib/utils";
import Loader from "../components/Loader";
import "./Lesson.css";

function SpeakButton({ text, language, large = false }) {
  if (!canSpeak) return null;
  return (
    <button
      type="button"
      className={`speak-btn ${large ? "large" : ""}`}
      onClick={() => speak(text, language)}
      aria-label="Listen"
      title="Listen"
    >
      🔊
    </button>
  );
}

function MatchExercise({ pairs, language, onDone }) {
  const [right] = useState(() => shuffle(pairs));
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrong, setWrong] = useState(null);
  const mistakes = useRef(0);

  const tryMatch = (leftTerm, rightTerm) => {
    setSelected(null);
    if (leftTerm === rightTerm) {
      const next = [...matched, leftTerm];
      setMatched(next);
      speak(leftTerm, language);
      if (next.length === pairs.length) onDone(mistakes.current === 0, mistakes.current);
    } else {
      mistakes.current += 1;
      setWrong([leftTerm, rightTerm]);
      setTimeout(() => setWrong(null), 600);
    }
  };

  const select = (side, term) => {
    if (matched.includes(term)) return;
    if (!selected || selected.side === side) {
      setSelected({ side, term });
      return;
    }
    const leftTerm = side === "left" ? term : selected.term;
    const rightTerm = side === "right" ? term : selected.term;
    tryMatch(leftTerm, rightTerm);
  };

  const stateOf = (side, term) => {
    if (matched.includes(term)) return "matched";
    if (wrong && wrong[side === "left" ? 0 : 1] === term) return "wrong";
    if (selected?.side === side && selected.term === term) return "selected";
    return "";
  };

  return (
    <div className="match-grid">
      <div className="match-col">
        {pairs.map((p) => (
          <button
            key={p.term}
            className={`option match-item ${stateOf("left", p.term)}`}
            onClick={() => select("left", p.term)}
            disabled={matched.includes(p.term)}
          >
            {p.term}
            {p.hint && <small>{p.hint}</small>}
          </button>
        ))}
      </div>
      <div className="match-col">
        {right.map((p) => (
          <button
            key={p.term}
            className={`option match-item ${stateOf("right", p.term)}`}
            onClick={() => select("right", p.term)}
            disabled={matched.includes(p.term)}
          >
            {p.meaning}
          </button>
        ))}
      </div>
    </div>
  );
}

function Results({ lesson, result, saving, saveError, onRetrySave, accuracy }) {
  const navigate = useNavigate();

  if (saving) return <Loader label="Saving your progress…" fullscreen />;

  return (
    <div className="lesson-results">
      <div className="results-trophy" aria-hidden="true">
        {lesson.type === "checkpoint" ? "🏆" : "🎉"}
      </div>
      <h1>{lesson.type === "checkpoint" ? "Checkpoint passed!" : "Lesson complete!"}</h1>
      {result?.levelCompleted && (
        <p className="alert alert-success">You finished level {lesson.level}! 🎊</p>
      )}

      {result && (
        <div className="results-stars" aria-label={`${result.stars} of 3 stars`}>
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= result.stars ? "on" : ""} style={{ animationDelay: `${n * 0.15}s` }}>
              ★
            </span>
          ))}
        </div>
      )}

      <div className="results-stats">
        <div className="card">
          <span className="results-value">{accuracy}%</span>
          <span>Accuracy</span>
        </div>
        <div className="card">
          <span className="results-value">+{result?.xp ?? 0}</span>
          <span>XP earned</span>
        </div>
      </div>

      {saveError && (
        <p className="alert alert-error">
          {saveError}{" "}
          <button className="btn btn-sm btn-secondary" onClick={onRetrySave}>
            Retry
          </button>
        </p>
      )}

      <div className="results-actions">
        {result?.nextLessonId && (
          <button
            className="btn btn-primary btn-block"
            onClick={() => navigate(`/learn/${result.nextLessonId}`, { replace: true })}
            autoFocus
          >
            Next lesson →
          </button>
        )}
        <Link to="/learn" className="btn btn-secondary btn-block">
          Back to path
        </Link>
      </div>
    </div>
  );
}

function LessonRunner({ lesson }) {
  const navigate = useNavigate();
  const language = getLanguage(lesson.language);

  const [exercises] = useState(() => buildExercises(lesson));
  const [queue, setQueue] = useState(exercises);
  const [position, setPosition] = useState(0);
  const [mistakes, setMistakes] = useState(() => new Set());
  const [solved, setSolved] = useState(0);
  const [selected, setSelected] = useState(null);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const exercise = queue[position];
  const total = exercises.length;
  const accuracy = Math.round(((total - mistakes.size) / total) * 100);

  // Listening exercises play the audio as soon as they appear.
  useEffect(() => {
    if (exercise?.type === "listen") speak(exercise.card.term, lesson.language);
    if (exercise?.type === "type") inputRef.current?.focus();
  }, [exercise, position, lesson.language]);

  const saveResult = useCallback(
    async (correctCount) => {
      setSaving(true);
      setSaveError("");
      try {
        const res = await api.post(`/learn/lessons/${lesson.id}/complete`, {
          language: lesson.language,
          correct: correctCount,
          total,
        });
        setResult(res.data);
      } catch (err) {
        setSaveError(errorMessage(err, "Couldn't save your progress."));
      } finally {
        setSaving(false);
      }
    },
    [lesson.id, lesson.language, total],
  );

  const registerAnswer = (correct, note = null) => {
    setFeedback({ correct, note });
    if (correct) {
      setSolved((n) => n + 1);
      if (exercise.card) speak(exercise.card.term, lesson.language);
    } else if (exercise.type !== "match") {
      setMistakes((prev) => new Set(prev).add(exercise.id));
      setQueue((q) => [...q, exercise]); // try it again at the end
    }
  };

  const check = () => {
    if (feedback || !exercise) return;
    if (exercise.type === "type") {
      if (!typed.trim()) return;
      const { correct, note } = checkTyped(typed, exercise.answer, lesson.language);
      registerAnswer(correct, note);
    } else if (selected !== null) {
      registerAnswer(selected === exercise.answer);
    }
  };

  const handleMatchDone = (perfect, count) => {
    if (!perfect) setMistakes((prev) => new Set(prev).add(exercise.id));
    setSolved((n) => n + 1);
    setFeedback({
      correct: true,
      note: perfect ? null : `${count} mismatch${count === 1 ? "" : "es"} — keep practicing these.`,
    });
  };

  const next = () => {
    if (position + 1 < queue.length) {
      setPosition((p) => p + 1);
      setSelected(null);
      setTyped("");
      setFeedback(null);
    } else {
      setFinished(true);
      saveResult(total - mistakes.size);
    }
  };

  // Keyboard: 1–4 pick an option, Enter checks / continues.
  useEffect(() => {
    if (finished) return;
    const onKey = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (feedback) next();
        else check();
        return;
      }
      if (feedback || !exercise?.options || e.target.tagName === "INPUT") return;
      const index = Number(e.key) - 1;
      if (index >= 0 && index < exercise.options.length) setSelected(exercise.options[index]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const exit = () => {
    if (solved === 0 || window.confirm("Leave this lesson? Your progress in it will be lost.")) {
      navigate("/learn");
    }
  };

  if (finished) {
    return (
      <div className="lesson-screen">
        <Results
          lesson={lesson}
          result={result}
          saving={saving}
          saveError={saveError}
          onRetrySave={() => saveResult(total - mistakes.size)}
          accuracy={accuracy}
        />
      </div>
    );
  }

  const prompts = {
    choice: "What does this mean?",
    reverse: `How do you say this in ${language.label}?`,
    listen: "Tap what you hear",
    type: `Write this in ${language.label}`,
    match: "Match the pairs",
  };

  return (
    <div className="lesson-screen">
      <header className="lesson-topbar">
        <button className="icon-btn" onClick={exit} aria-label="Exit lesson">
          ✕
        </button>
        <div
          className="progress lesson-progress"
          role="progressbar"
          aria-valuenow={solved}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <div className="progress-fill" style={{ width: `${(solved / total) * 100}%` }} />
        </div>
        <span className="lesson-count">
          {solved}/{total}
        </span>
      </header>

      <main className="lesson-body" key={`${exercise.id}-${position}`}>
        <p className="lesson-unit">
          {lesson.unitIcon} {lesson.level} · {lesson.title}
          {position >= total && <span className="badge retry-badge">Review</span>}
        </p>
        <h2 className="lesson-prompt">{prompts[exercise.type]}</h2>

        {exercise.type === "choice" && (
          <div className="prompt-card">
            <SpeakButton text={exercise.card.term} language={lesson.language} />
            <span className="prompt-text">{exercise.card.term}</span>
            {exercise.card.hint && <span className="prompt-hint">{exercise.card.hint}</span>}
          </div>
        )}
        {(exercise.type === "reverse" || exercise.type === "type") && (
          <div className="prompt-card">
            <span className="prompt-text">“{exercise.card.meaning}”</span>
          </div>
        )}
        {exercise.type === "listen" && (
          <div className="prompt-card">
            <SpeakButton text={exercise.card.term} language={lesson.language} large />
          </div>
        )}

        {exercise.options && (
          <div className="options">
            {exercise.options.map((option, i) => {
              let state = selected === option ? "selected" : "";
              if (feedback && option === exercise.answer) state = "correct";
              else if (feedback && selected === option) state = "wrong";
              return (
                <button
                  key={option}
                  className={`option ${state}`}
                  onClick={() => !feedback && setSelected(option)}
                  disabled={Boolean(feedback)}
                >
                  <kbd>{i + 1}</kbd>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        )}

        {exercise.type === "type" && (
          <input
            ref={inputRef}
            className="input type-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={`Type in ${language.label}…`}
            disabled={Boolean(feedback)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            lang={lesson.language}
          />
        )}

        {exercise.type === "match" && (
          <MatchExercise pairs={exercise.pairs} language={lesson.language} onDone={handleMatchDone} />
        )}
      </main>

      <footer className={`lesson-footer ${feedback ? (feedback.correct ? "correct" : "wrong") : ""}`}>
        <div className="lesson-footer-inner">
          <div className="feedback-text" role="status" aria-live="polite">
            {feedback && (
              <>
                <strong>{feedback.correct ? "✓ Correct!" : "✗ Not quite"}</strong>
                {!feedback.correct && exercise.card && (
                  <span>
                    Answer: {exercise.answer}
                    {exercise.card.hint && exercise.answer === exercise.card.term
                      ? ` (${exercise.card.hint})`
                      : ""}
                  </span>
                )}
                {feedback.correct && exercise.type === "type" && (
                  <span>{exercise.answer}</span>
                )}
                {feedback.note && <span>{feedback.note}</span>}
              </>
            )}
          </div>
          {feedback ? (
            <button className={`btn ${feedback.correct ? "btn-success" : "btn-error"} footer-btn`} onClick={next}>
              Continue
            </button>
          ) : (
            exercise.type !== "match" && (
              <button
                className="btn btn-primary footer-btn"
                onClick={check}
                disabled={exercise.type === "type" ? !typed.trim() : selected === null}
              >
                Check
              </button>
            )
          )}
        </div>
      </footer>
    </div>
  );
}

function Lesson() {
  const { lessonId } = useParams();
  const { targetLanguage } = useLanguage();
  const { data, loading, error } = useApi(
    `/learn/lessons/${lessonId}?language=${targetLanguage}`,
  );

  if (loading) return <Loader label="Preparing your lesson…" fullscreen />;
  if (error) {
    return (
      <div className="lesson-screen lesson-error">
        <p className="empty-state">
          <span className="empty-icon">🔒</span>
          {error}
        </p>
        <Link to="/learn" className="btn btn-primary">
          Back to path
        </Link>
      </div>
    );
  }
  return <LessonRunner key={`${data.id}-${data.language}`} lesson={data} />;
}

export default Lesson;
