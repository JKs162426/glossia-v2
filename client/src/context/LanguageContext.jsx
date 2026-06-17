import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const LanguageContext = createContext();

export const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "it", label: "Italian", flag: "🇮🇹" },
  { code: "pt", label: "Portuguese", flag: "🇧🇷" },
  { code: "ru", label: "Russian", flag: "🇷🇺" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
];

export const LanguageProvider = ({ children }) => {
  const { user } = useAuth();
  const [targetLanguage, setTargetLanguage] = useState("es");

  useEffect(() => {
    if (user) {
      fetchLanguage();
    }
  }, [user]);

  const fetchLanguage = async () => {
    try {
      const res = await api.get("/users/me");
      setTargetLanguage(res.data.target_language || "es");
    } catch (error) {
      console.error("Error fetching language");
    }
  };

  const changeLanguage = async (code) => {
    try {
      await api.put("/users/language", { language: code });
      setTargetLanguage(code);
    } catch (error) {
      console.error("Error updating language");
    }
  };

  return (
    <LanguageContext.Provider value={{ targetLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
