import { getLanguage } from "./languages";

export const canSpeak =
  typeof window !== "undefined" && "speechSynthesis" in window;

// Pronounces text with the browser's built-in text-to-speech.
export function speak(text, languageCode) {
  if (!canSpeak || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/…/g, ""));
  utterance.lang = getLanguage(languageCode).speech;
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}
