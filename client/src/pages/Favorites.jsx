import { useState, useEffect } from 'react';
import api from '../services/api';
import './Favorites.css';

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/favorites');
      setFavorites(res.data);
    } catch (error) {
      console.error('Error fetching favorites');
    }
    setLoading(false);
  };

  const deleteFavorite = async (id) => {
    try {
      await api.delete(`/favorites/${id}`);
      setFavorites(favorites.filter((f) => f.id !== id));
    } catch (error) {
      console.error('Error deleting favorite');
    }
  };

  return (
    <div className="favorites">
      <div className="favorites-header">
        <h1>Favorites ⭐</h1>
        <p>Words you've saved from the translator</p>
      </div>

      {loading ? (
        <p className="empty-state">Loading...</p>
      ) : favorites.length === 0 ? (
        <p className="empty-state">No favorites yet. Go translate something!</p>
      ) : (
        <div className="favorites-grid">
          {favorites.map((fav) => (
            <div key={fav.id} className="favorite-card">
              <span className="lang-badge">{fav.language.toUpperCase()}</span>
              <h3>{fav.word}</h3>
              <p>{fav.translation}</p>
              <button className="delete-btn" onClick={() => deleteFavorite(fav.id)}>
                🗑 Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
