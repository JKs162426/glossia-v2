import { getLanguage } from "./languages";

export const canSpeak =
  typeof window !== "undefined" && "speechSynthesis" in window;

// What is being spoken right now, so speaker icons can animate while it plays.
let speaking = { utterance: null, text: null };
const listeners = new Set();

const setSpeaking = (next) => {
  speaking = next;
  listeners.forEach((listener) => listener());
};

export const getSpokenText = () => speaking.text;

export function subscribeSpeaking(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Pronounces text with the browser's built-in text-to-speech.
export function speak(text, languageCode) {
  if (!canSpeak || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/…/g, ""));
  utterance.lang = getLanguage(languageCode).speech;
  utterance.rate = 0.9;
  utterance.onstart = () => setSpeaking({ utterance, text });
  // cancel() also ends the previous utterance, sometimes after the next one
  // has started, so only the current utterance may clear the state.
  utterance.onend = utterance.onerror = () => {
    if (speaking.utterance === utterance) setSpeaking({ utterance: null, text: null });
  };
  window.speechSynthesis.speak(utterance);
}
