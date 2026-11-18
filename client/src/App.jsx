import { lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ProtectedLayout, PublicOnly } from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import CategorySelect from "./pages/CategorySelect";
import Flashcards from "./pages/Flashcards";
import Favorites from "./pages/Favorites";
import Account from "./pages/Account";

// The two largest pages load in their own files, so the first screen
// downloads less. The layouts show a loader while one arrives.
const loadLesson = () => import("./pages/Lesson");
const loadTranslator = () => import("./pages/Translator");
const Lesson = lazy(loadLesson);
const Translator = lazy(loadTranslator);

function App() {
  // Once the first screen is up, fetch them in the background, so opening a
  // lesson doesn't wait for one more download.
  useEffect(() => {
    const timer = setTimeout(() => {
      loadLesson();
      loadTranslator();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicOnly />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* Logged in or not: the emailed link must always open. */}
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/flashcards" element={<CategorySelect />} />
              <Route path="/flashcards/:deckId" element={<Flashcards />} />
              <Route path="/translator" element={<Translator />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/account" element={<Account />} />
            </Route>
            {/* Lessons are full-screen, without the sidebar */}
            <Route element={<ProtectedLayout bare />}>
              <Route path="/learn/:lessonId" element={<Lesson />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
