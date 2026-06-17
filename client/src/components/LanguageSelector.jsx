import { useState } from "react";
import { useLanguage, languages } from "../context/LanguageContext";
import "./LanguageSelector.css";

function LanguageSelector() {
  const { targetLanguage, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  const current =
    languages.find((l) => l.code === targetLanguage) || languages[1];

  const handleSelect = (code) => {
    changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="lang-selector">
      <button className="lang-trigger" onClick={() => setOpen(!open)}>
        <span>{current.flag}</span>
        <span className="lang-trigger-label">{current.label}</span>
        <span className="lang-arrow">▾</span>
      </button>

      {open && (
        <>
          <div className="lang-overlay" onClick={() => setOpen(false)} />
          <div className="lang-dropdown">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`lang-option ${
                  lang.code === targetLanguage ? "active" : ""
                }`}
                onClick={() => handleSelect(lang.code)}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LanguageSelector;
