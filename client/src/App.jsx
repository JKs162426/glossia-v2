import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Flashcards from './pages/Flashcards';
import Translator from './pages/Translator';
import Favorites from './pages/Favorites';
import './index.css';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{
        marginLeft: '240px',
        padding: '32px',
        flex: 1,
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <ProtectedLayout>
          <Home />
        </ProtectedLayout>
      } />
      <Route path="/flashcards" element={
        <ProtectedLayout>
          <Flashcards />
        </ProtectedLayout>
      } />
      <Route path="/translator" element={
        <ProtectedLayout>
          <Translator />
        </ProtectedLayout>
      } />
      <Route path="/favorites" element={
        <ProtectedLayout>
          <Favorites />
        </ProtectedLayout>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
