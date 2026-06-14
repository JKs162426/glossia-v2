import { useState } from 'react';
import api from '../services/api';
import './Translator.css';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ru', label: 'Russian' },
  { code: 'zh', label: 'Chinese' },
];

function Translator() {
  const [text, setText] = useState('');
  const [translated, setTranslated] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const translate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
      );
      const data = await res.json();
      setTranslated(data.responseData.translatedText);
    } catch (error) {
      setTranslated('Translation failed. Try again.');
    }
    setLoading(false);
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setText(translated);
    setTranslated(text);
  };

  const saveFavorite = async () => {
    if (!text.trim() || !translated) return;
    try {
      await api.post('/favorites', {
        word: text,
        translation: translated,
        language: sourceLang,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving favorite');
    }
  };

  return (
    <div className="translator">
      <div className="translator-header">
        <h1>Translator</h1>
        <p>Translate and save words to your favorites</p>
      </div>

      <div className="translator-box">
        <div className="lang-selectors">
          <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>

          <button className="swap-btn" onClick={swapLanguages}>⇄</button>

          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="translation-panels">
          <div className="panel">
            <textarea
              placeholder="Enter text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="panel result">
            <p>{loading ? 'Translating...' : translated || 'Translation will appear here'}</p>
          </div>
        </div>

        <div className="translator-actions">
          <button className="translate-btn" onClick={translate}>
            Translate
          </button>
          <button className="favorite-btn" onClick={saveFavorite} disabled={!translated}>
            {saved ? '✅ Saved!' : '⭐ Save to Favorites'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Translator;
