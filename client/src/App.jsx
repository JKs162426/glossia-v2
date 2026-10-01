import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ProtectedLayout, PublicOnly } from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import Lesson from "./pages/Lesson";
import CategorySelect from "./pages/CategorySelect";
import Flashcards from "./pages/Flashcards";
import Translator from "./pages/Translator";
import Favorites from "./pages/Favorites";

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicOnly />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/flashcards" element={<CategorySelect />} />
              <Route path="/flashcards/:deckId" element={<Flashcards />} />
              <Route path="/translator" element={<Translator />} />
              <Route path="/favorites" element={<Favorites />} />
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
