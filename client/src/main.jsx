import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Fonts are served from our own origin (no Google Fonts), so the CSP can stay
// strict. Each file covers every weight; the browser downloads only the
// alphabets a page uses (Latin, Cyrillic for Russian…).
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
