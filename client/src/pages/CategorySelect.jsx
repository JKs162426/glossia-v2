import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import "./CategorySelect.css";

function CategorySelect() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { targetLanguage } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories");
    }
    setLoading(false);
  };

  const selectCategory = (category) => {
    navigate(`/flashcards/${category.id}`, { state: { category } });
  };

  return (
    <div className="category-select">
      <div className="category-header">
        <h1>Flashcards 🃏</h1>
        <p>Choose a category to start practicing</p>
      </div>

      {loading ? (
        <p className="empty-state">Loading...</p>
      ) : (
        <div className="category-grid">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="category-card"
              onClick={() => selectCategory(cat)}
            >
              <span className="category-icon">{cat.icon}</span>
              <h3>{cat.name}</h3>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategorySelect;
