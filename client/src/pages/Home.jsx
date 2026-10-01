import { Link } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useLanguage } from "../context/language-context";
import { useApi } from "../hooks/useApi";
import { getLanguage } from "../lib/languages";
import Loader from "../components/Loader";
import "./Home.css";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 19) return "Good afternoon";
  return "Good evening";
};

const weekdayFormat = new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" });
const fullDateFormat = new Intl.DateTimeFormat("en", {
  weekday: "long",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function WeeklyChart({ week }) {
  const max = Math.max(...week.map((d) => d.xp), 1);
  const total = week.reduce((sum, d) => sum + d.xp, 0);

  return (
    <div className="card">
      <h3 className="section-title">
        This week <span className="chart-total">{total} XP</span>
      </h3>
      <div className="week-chart" role="list" aria-label="XP earned per day this week">
        {week.map((d, i) => {
          const date = new Date(`${d.day}T00:00:00Z`);
          const isToday = i === week.length - 1;
          return (
            <div
              key={d.day}
              className="week-bar-col"
              role="listitem"
              aria-label={`${fullDateFormat.format(date)}: ${d.xp} XP`}
            >
              <div className="week-bar-track">
                <span className="week-tooltip">
                  {fullDateFormat.format(date)} · {d.xp} XP
                </span>
                <div
                  className={`week-bar ${d.xp === 0 ? "empty" : ""}`}
                  style={{ height: d.xp ? `${(d.xp / max) * 100}%` : undefined }}
                />
              </div>
              <span className={`week-label ${isToday ? "today" : ""}`}>
                {isToday ? "Today" : weekdayFormat.format(date)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContinueCard({ nextLesson, levels }) {
  return (
    <div className="card continue-card">
      <div className="continue-main">
        {nextLesson ? (
          <>
            <span className="badge">
              {nextLesson.level} · {nextLesson.unitTitle}
            </span>
            <h2>
              <span aria-hidden="true">{nextLesson.unitIcon}</span> {nextLesson.title}
            </h2>
            <p>
              {nextLesson.type === "checkpoint"
                ? "Unit checkpoint — prove what you've learned."
                : "Your next lesson is ready."}
            </p>
            <Link to={`/learn/${nextLesson.id}`} className="btn btn-primary">
              Continue learning →
            </Link>
          </>
        ) : (
          <>
            <span className="badge">All done</span>
            <h2>🏆 You finished A1 and A2!</h2>
            <p>Keep your words fresh with flashcards.</p>
            <Link to="/flashcards" className="btn btn-primary">
              Practice flashcards →
            </Link>
          </>
        )}
      </div>

      <div className="continue-levels">
        {levels.map((level) => {
          const pct = Math.round((level.completed / level.total) * 100);
          return (
            <div key={level.id} className="level-progress">
              <div className="level-progress-label">
                <strong>{level.id}</strong> <span>{level.title}</span>
                <span className="level-progress-pct">{pct}%</span>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-label={`${level.id} progress`}
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  const { targetLanguage } = useLanguage();
  const language = getLanguage(targetLanguage);
  const { data, loading, error, reload } = useApi(
    `/stats/overview?language=${targetLanguage}`,
  );

  const stats = data && [
    { label: "Day streak", value: data.streak, icon: "🔥" },
    { label: "Total XP", value: data.totalXp, icon: "⚡" },
    { label: `${language.label} words learned`, value: data.wordsLearned, icon: "📚" },
    { label: "Flashcards reviewed", value: data.flashcardsReviewed, icon: "🃏" },
  ];

  return (
    <div className="page dashboard">
      <header className="page-header">
        <div>
          <h1>
            {greeting()}, {user?.username}! 👋
          </h1>
          <p>
            You're learning {language.flag} {language.label}. Ready for today's practice?
          </p>
        </div>
      </header>

      {loading && <Loader />}
      {error && (
        <div className="alert alert-error dashboard-error">
          {error}{" "}
          <button className="btn btn-sm btn-secondary" onClick={reload}>
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          <ContinueCard nextLesson={data.nextLesson} levels={data.levels} />

          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="card stat-card">
                <span className="stat-icon" aria-hidden="true">
                  {stat.icon}
                </span>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="dashboard-sections">
            <WeeklyChart week={data.week} />

            <div className="card">
              <h3 className="section-title">
                Recent flashcards <Link to="/flashcards">Practice</Link>
              </h3>
              {data.recentSessions.length === 0 ? (
                <p className="empty-state">No sessions yet. Try a deck!</p>
              ) : (
                <ul className="activity-list">
                  {data.recentSessions.map((s) => (
                    <li key={s.id}>
                      <span className="activity-icon" aria-hidden="true">
                        {s.icon}
                      </span>
                      <span className="activity-main">
                        {s.category}
                        <small>{getLanguage(s.language).label}</small>
                      </span>
                      <span className="activity-score">
                        {s.correct}/{s.total}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card dashboard-wide">
              <h3 className="section-title">
                Recent favorites <Link to="/favorites">See all ({data.favorites})</Link>
              </h3>
              {data.recentFavorites.length === 0 ? (
                <p className="empty-state">
                  No favorites yet. Save words from the{" "}
                  <Link to="/translator" className="inline-link">
                    translator
                  </Link>
                  .
                </p>
              ) : (
                <div className="favorites-strip">
                  {data.recentFavorites.map((f) => (
                    <div key={f.id} className="favorite-chip">
                      <span aria-hidden="true">{getLanguage(f.language).flag}</span>
                      <strong>{f.word}</strong>
                      <span>{f.translation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
