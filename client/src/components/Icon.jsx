import { ICONS, DEFAULT_ICON } from "../lib/icons";
import { getLanguage } from "../lib/languages";
import "./Icon.css";

// Decorative by default (hidden from screen readers). Pass `label` when the
// icon is the only content of a control, e.g. an icon-only button.
export function Icon({ name, size = 20, filled = false, label, className = "", ...rest }) {
  const shapes = ICONS[name] || ICONS[DEFAULT_ICON];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {shapes.map(([tag, attrs], i) => {
        if (tag === "dot") {
          return <circle key={i} {...attrs} fill="currentColor" stroke="none" />;
        }
        const Shape = tag;
        return <Shape key={i} {...attrs} />;
      })}
    </svg>
  );
}

// A language is shown by its native initials ("Es", "Ру", "中") instead of a
// country flag: flags stand for countries, not languages, and Windows doesn't
// render flag emoji at all.
export function LanguageMark({ code, size = "md", className = "" }) {
  const language = getLanguage(code);
  return (
    <span className={`lang-mark lang-mark-${size} ${className}`} lang={language.code} aria-hidden="true">
      {language.mark}
    </span>
  );
}
