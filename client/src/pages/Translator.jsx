import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useLanguage } from "../context/language-context";
import { LANGUAGES, baseLanguageFor, getLanguage } from "../lib/languages";
import { canSpeak, speak } from "../lib/speech";
import { Icon } from "../components/Icon";
import { SpeakerIcon } from "../components/SpeakerIcon";
import "./Translator.css";

const MAX_CHARS = 500; // MyMemory's limit per request
const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

async function fetchTranslation(text, source, target, signal) {
  const params = new URLSearchParams({ q: text, langpair: `${source}|${target}` });
  const res = await fetch(`https://api.mymemory.translated.net/get?${params}`, { signal });
  const data = await res.json();
  // MyMemory answers HTTP 200 even on errors; the real status is in the body.
  if (Number(data.responseStatus) !== 200 || !data.responseData?.translatedText) {
    const quota = String(data.responseDetails || "").includes("QUOTA");
    throw new Error(
      quota
        ? "Daily translation limit reached. Try again tomorrow."
        : "Translation failed. Try again.",
    );
  }
  return data.responseData.translatedText;
}

// Favorites store the word in the language being studied (`word`) plus its
// meaning, so they can be practiced later as a flashcard deck.
function toFavorite(result, learning) {
  const learningIsSource = result.source === learning && result.target !== learning;
  return learningIsSource
    ? { word: result.text, translation: result.translated, language: result.source }
    : { word: result.translated, translation: result.text, language: result.target };
}

function Translator() {
  const { targetLanguage } = useLanguage();
  const [text, setText] = useState("");
  const [sourceLang, setSourceLang] = useState(() => baseLanguageFor(targetLanguage));
  const [targetLang, setTargetLang] = useState(targetLanguage);
  // The last successful translation and exactly what produced it.
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | exists | error
  const [copied, setCopied] = useState(false);
  const [swapTurns, setSwapTurns] = useState(0); // the swap icon turns half a circle per click
  const controllerRef = useRef(null);

  const isStale =
    result &&
    (result.text !== text.trim() || result.source !== sourceLang || result.target !== targetLang);
  const sameLanguages = sourceLang === targetLang;

  const translate = async () => {
    const query = text.trim();
    if (!query || sameLanguages || loading) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError("");
    setSaveState("idle");
    try {
      const translated = await fetchTranslation(query, sourceLang, targetLang, controller.signal);
      setResult({ text: query, translated, source: sourceLang, target: targetLang });
    } catch (err) {
      if (err.name !== "AbortError") {
        // fetch() itself throws a TypeError when the network is unreachable.
        setError(
          err instanceof TypeError
            ? "Couldn't reach the translation service. Check your connection."
            : err.message,
        );
        setResult(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const swapLanguages = () => {
    setSwapTurns((turns) => turns + 1);
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    if (result && !isStale) {
      setText(result.translated);
      setResult({
        text: result.translated,
        translated: result.text,
        source: result.target,
        target: result.source,
      });
    }
    setSaveState("idle");
  };

  const saveFavorite = async () => {
    if (!result || isStale) return;
    setSaveState("saving");
    try {
      await api.post("/favorites", toFavorite(result, targetLanguage));
      setSaveState("saved");
    } catch (err) {
      setSaveState(err.response?.status === 409 ? "exists" : "error");
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.translated);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard not available — nothing to do */
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      translate();
    }
  };

  const [saveIcon, saveText] = {
    idle: ["star", "Save to favorites"],
    saving: ["star", "Saving…"],
    saved: ["star", "Saved!"],
    exists: ["star", "Already saved"],
    error: ["close", "Couldn't save — retry"],
  }[saveState];

  const languageSelect = (id, value, onChange, label) => (
    <label className="lang-field">
      <span className="sr-only">{label}</span>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="page translator">
      <header className="page-header">
        <div>
          <h1>Translator</h1>
          <p>Translate words and phrases, then save them to practice later.</p>
        </div>
      </header>

      <div className="card translator-box">
        <div className="lang-selectors">
          {languageSelect("source-lang", sourceLang, setSourceLang, "Translate from")}
          <button
            className="btn btn-secondary swap-btn"
            onClick={swapLanguages}
            aria-label="Swap languages"
            title="Swap languages"
          >
            <Icon name="swap" className="swap-icon" style={{ transform: `rotate(${swapTurns * 180}deg)` }} />
          </button>
          {languageSelect("target-lang", targetLang, setTargetLang, "Translate to")}
        </div>

        <div className="translation-panels">
          <div className="panel">
            <textarea
              aria-label="Text to translate"
              placeholder="Enter text…"
              value={text}
              maxLength={MAX_CHARS}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              lang={sourceLang}
            />
            <div className="panel-footer">
              {canSpeak && text && (
                <button className="icon-btn" onClick={() => speak(text, sourceLang)} aria-label="Listen to the source text">
                  <SpeakerIcon text={text} size={18} />
                </button>
              )}
              {text && (
                <button className="icon-btn" onClick={() => setText("")} aria-label="Clear text">
                  <Icon name="close" size={18} />
                </button>
              )}
              <span className={`char-count ${text.length >= MAX_CHARS ? "limit" : ""}`}>
                {text.length}/{MAX_CHARS}
              </span>
            </div>
          </div>

          <div className={`panel result ${isStale ? "stale" : ""}`} aria-live="polite">
            {loading ? (
              <div className="result-loading">
                <span className="sr-only">Translating…</span>
                <span className="skeleton" />
                <span className="skeleton short" />
              </div>
            ) : (
              // key: a new translation fades in instead of replacing the old one in place
              <p
                key={result?.translated}
                className={result ? "result-text" : "placeholder"}
                lang={targetLang}
              >
                {error ? "" : result?.translated || "Translation will appear here"}
              </p>
            )}
            {error && <p className="alert alert-error">{error}</p>}
            {result && !loading && (
              <div className="panel-footer">
                {canSpeak && (
                  <button
                    className="icon-btn"
                    onClick={() => speak(result.translated, result.target)}
                    aria-label="Listen to the translation"
                  >
                    <SpeakerIcon text={result.translated} size={18} />
                  </button>
                )}
                <button className="icon-btn" onClick={copy} aria-label="Copy translation">
                  <Icon name={copied ? "check" : "copy"} size={18} className={copied ? "icon-draw" : ""} />
                </button>
                {isStale && <span className="stale-note">Text changed — translate again</span>}
              </div>
            )}
          </div>
        </div>

        {sameLanguages && (
          <p className="alert alert-error">Choose two different languages.</p>
        )}

        <div className="translator-actions">
          <button
            className="btn btn-primary translate-btn"
            onClick={translate}
            disabled={!text.trim() || sameLanguages || loading}
          >
            {loading ? "Translating…" : "Translate"}
            <kbd className="shortcut">{IS_MAC ? "⌘ Enter" : "Ctrl Enter"}</kbd>
          </button>
          <button
            className="btn btn-secondary"
            onClick={saveFavorite}
            disabled={!result || isStale || ["saving", "saved", "exists"].includes(saveState)}
          >
            <Icon
              name={saveIcon}
              size={18}
              filled={saveState === "saved" || saveState === "exists"}
              className={saveState === "saved" ? "icon-pop saved-star" : ""}
            />
            {saveText}
          </button>
        </div>

        {saveState === "saved" && (
          <p className="save-hint">
            Saved as a {getLanguage(toFavorite(result, targetLanguage).language).label} word.{" "}
            <Link to="/favorites" className="inline-icon-link">
              View favorites <Icon name="arrow-right" size={14} />
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default Translator;
