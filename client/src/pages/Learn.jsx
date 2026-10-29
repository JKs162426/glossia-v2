import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/language-context";
import { useApi } from "../hooks/useApi";
import { getLanguage } from "../lib/languages";
import { celebrationFor } from "../lib/path";
import Loader from "../components/Loader";
import { Icon, LanguageMark } from "../components/Icon";
import "./Learn.css";

// Zig-zag offsets for the path nodes (in px, applied as translateX).
const OFFSETS = [0, 56, 84, 56, 0, -56, -84, -56];

function Stars({ count }) {
  return (
    <span className="node-stars" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((n) => (
        <Icon
          key={n}
          name="star"
          size={13}
          filled
          className={n <= count ? "on" : ""}
          style={{ "--n": n }}
        />
      ))}
    </span>
  );
}

// `celebrate`: "completed" for the node just finished, "unlocked" for the one
// it opened (shown with its lock coming off), null otherwise.
function PathNode({ node, offset, celebrate }) {
  const icon =
    node.status === "locked"
      ? "lock"
      : node.type === "checkpoint"
        ? "trophy"
        : node.status === "completed"
          ? "check"
          : "star";
  const label = `${node.title} — ${
    node.status === "locked"
      ? "locked"
      : node.status === "completed"
        ? "completed, practice again"
        : "start"
  }`;

  const content = (
    <>
      {node.status === "current" && <span className="node-bubble">Start</span>}
      <span className="node-circle" aria-hidden="true">
        <Icon name={icon} size={node.status === "locked" ? 24 : 28} filled={icon === "star"} />
        {celebrate === "unlocked" && <Icon name="lock" size={24} className="unlock-lock" />}
      </span>
      <span className="node-title">{node.title}</span>
      {node.status === "completed" && <Stars count={node.stars} />}
    </>
  );

  const className = `path-node ${node.status} ${node.type} ${celebrate ? `just-${celebrate}` : ""}`;
  const style = { transform: `translateX(${offset}px)` };

  return node.status === "locked" ? (
    <div
      className={className}
      style={style}
      aria-label={label}
      title="Finish the previous lessons first"
      data-node-id={node.id}
    >
      {content}
    </div>
  ) : (
    <Link
      to={`/learn/${node.id}`}
      className={className}
      style={style}
      aria-label={label}
      data-node-id={node.id}
    >
      {content}
    </Link>
  );
}

function Learn() {
  const { targetLanguage } = useLanguage();
  const language = getLanguage(targetLanguage);
  const { data, loading, error, reload } = useApi(`/learn/path?language=${targetLanguage}`);
  const location = useLocation();
  const navigate = useNavigate();
  const pathRef = useRef(null);

  // Set by the results screen after a first completion. Kept in state and
  // cleared from history, so a reload or "back" doesn't replay the animation.
  const [justCompleted] = useState(() => location.state?.justCompleted ?? null);
  const celebration = celebrationFor(data?.levels, justCompleted);

  useEffect(() => {
    if (justCompleted) navigate(location.pathname, { replace: true, state: null });
  }, [justCompleted, navigate, location.pathname]);

  // Bring the node that was just unlocked (or finished, at the very end) into view.
  const focusId = celebration.unlockedId || celebration.completedId;
  useEffect(() => {
    if (!focusId) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    pathRef.current
      ?.querySelector(`[data-node-id="${focusId}"]`)
      ?.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, [focusId]);

  const celebrateFor = (id) =>
    id === celebration.completedId ? "completed" : id === celebration.unlockedId ? "unlocked" : null;

  return (
    <div className="page learn" ref={pathRef}>
      <header className="page-header">
        <div>
          <h1>
            Learn {language.label}{" "}
            <LanguageMark code={language.code} size="lg" className="lang-mark-inline" />
          </h1>
          <p>A guided path from your first words to everyday conversations.</p>
        </div>
      </header>

      {loading && <Loader label="Loading your path…" />}
      {error && (
        <div className="alert alert-error">
          {error}{" "}
          <button className="btn btn-sm btn-secondary" onClick={reload}>
            Retry
          </button>
        </div>
      )}

      {data?.levels.map((level) => {
        const pct = Math.round((level.completed / level.total) * 100);
        return (
          <section key={level.id} className="level" aria-labelledby={`level-${level.id}`}>
            <div
              className={`level-header card ${level.id === celebration.openedLevelId ? "just-opened" : ""}`}
            >
              <div className="level-tag">
                {level.id}
                {level.id === celebration.openedLevelId && (
                  <Icon name="sparkles" size={22} className="level-sparkles" />
                )}
              </div>
              <div className="level-info">
                <h2 id={`level-${level.id}`}>{level.title}</h2>
                <p>{level.description}</p>
                <div className="level-meter">
                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span>
                    {level.completed}/{level.total}
                  </span>
                </div>
              </div>
            </div>

            {level.units.map((unit, u) => (
              <div key={unit.id} className="unit">
                <div className="unit-header">
                  <span className="icon-tile">
                    <Icon name={unit.icon} size={22} />
                  </span>
                  <div>
                    <span className="unit-number">Unit {u + 1}</span>
                    <h3>{unit.title}</h3>
                  </div>
                </div>
                <div className="unit-path">
                  {unit.nodes.map((node, i) => (
                    <PathNode
                      key={node.id}
                      node={node}
                      offset={OFFSETS[(u * unit.nodes.length + i) % OFFSETS.length]}
                      celebrate={celebrateFor(node.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

export default Learn;
