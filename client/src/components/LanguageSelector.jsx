import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/language-context";
import { LANGUAGES, getLanguage } from "../lib/languages";
import { Icon, LanguageMark } from "./Icon";
import "./LanguageSelector.css";

function LanguageSelector() {
  const { targetLanguage, changeLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current = getLanguage(targetLanguage);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onClick = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const handleSelect = (code) => {
    if (code !== targetLanguage) changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="lang-selector" ref={rootRef}>
      <button
        className="lang-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Learning ${current.label}. Change language`}
      >
        <LanguageMark code={current.code} />
        <span className="lang-trigger-label">{current.label}</span>
        <Icon name="chevron-down" size={16} className="lang-arrow" />
      </button>

      {open && (
        <ul className="lang-dropdown" role="listbox" aria-label="Language to learn">
          {LANGUAGES.map((lang) => (
            <li key={lang.code}>
              <button
                role="option"
                aria-selected={lang.code === targetLanguage}
                className={`lang-option ${lang.code === targetLanguage ? "active" : ""}`}
                onClick={() => handleSelect(lang.code)}
              >
                <LanguageMark code={lang.code} size="sm" />
                <span>{lang.label}</span>
                {lang.code === targetLanguage && (
                  <Icon name="check" size={16} className="lang-check" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LanguageSelector;
