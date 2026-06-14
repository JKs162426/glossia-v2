import { useAuth } from '../context/AuthContext';
import './Home.css';

const stats = [
  { label: 'Words Learned', value: '0', icon: '📚' },
  { label: 'Favorites', value: '0', icon: '⭐' },
  { label: 'Flashcards Reviewed', value: '0', icon: '🃏' },
  { label: 'Day Streak', value: '0', icon: '🔥' },
];

function Home() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.username}! 👋</h1>
          <p>Ready to learn something new today?</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <span className="stat-icon">{stat.icon}</span>
            <h2>{stat.value}</h2>
            <p>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-sections">
        <div className="section-card">
          <h3>Recent Favorites</h3>
          <p className="empty-state">No favorites yet. Start translating!</p>
        </div>

        <div className="section-card">
          <h3>Flashcard Progress</h3>
          <p className="empty-state">No flashcards reviewed yet.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
