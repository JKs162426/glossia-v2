import { useSyncExternalStore } from "react";
import { getSpokenText, subscribeSpeaking } from "../lib/speech";
import { Icon } from "./Icon";

// The icon of a "listen" button: its sound waves pulse while `text` is spoken.
export function SpeakerIcon({ text, size }) {
  const spoken = useSyncExternalStore(subscribeSpeaking, getSpokenText);
  return <Icon name="speaker" size={size} className={spoken === text ? "speaking" : ""} />;
}
