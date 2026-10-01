import { useCallback, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "./auth-context";
import { LanguageContext } from "./language-context";
import { DEFAULT_LANGUAGE } from "../lib/languages";

// The target language is part of the user profile, so it comes straight from
// the auth context (no second request on load).
export function LanguageProvider({ children }) {
  const { user, setUser } = useAuth();
  const targetLanguage = user?.target_language || DEFAULT_LANGUAGE;

  const changeLanguage = useCallback(
    async (code) => {
      const previous = targetLanguage;
      setUser((u) => (u ? { ...u, target_language: code } : u));
      try {
        await api.put("/users/language", { language: code });
      } catch {
        setUser((u) => (u ? { ...u, target_language: previous } : u));
      }
    },
    [targetLanguage, setUser],
  );

  const value = useMemo(
    () => ({ targetLanguage, changeLanguage }),
    [targetLanguage, changeLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}
