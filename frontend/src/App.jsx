import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import api from './services/api';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GroupPage from './pages/GroupPage';
import PlayerStatsPage from './pages/PlayerStatsPage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootMessage, setBootMessage] = useState('Cargando...');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Reintentar /auth/me con backoff. Útil cuando el backend está en cold start (Render free tier).
  // Solo borra el token si el servidor responde explícitamente 401 (Unauthorized).
  const fetchUser = async (token, attempt = 1) => {
    const maxAttempts = 5;
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      const status = error.response?.status;

      if (status === 401 || status === 403) {
        // Token inválido o expirado: forzar logout
        console.warn('Token inválido, cerrando sesión');
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return;
      }

      // Error transitorio (timeout, network, 502, etc.): reintentar
      if (attempt < maxAttempts) {
        const delay = Math.min(2000 * attempt, 8000);
        if (attempt === 1) {
          setBootMessage('El servidor está despertando, esto puede tardar ~30s...');
        }
        console.log(`Reintento ${attempt}/${maxAttempts} en ${delay}ms`);
        setTimeout(() => fetchUser(token, attempt + 1), delay);
        return;
      }

      // Tras varios intentos seguimos fallando: dejar que el usuario lo intente luego
      // pero NO borrar el token (puede ser un problema temporal del servidor)
      console.error('No se pudo conectar al servidor. El token sigue guardado.');
      setBootMessage('No se pudo conectar al servidor. Recargá la página en un momento.');
      setLoading(false);
    }
  };

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    fetchUser(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1B5E20 0%, #0D3A14 100%)',
      color: 'white',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚽</div>
      <div style={{ fontSize: '1.1rem', maxWidth: '400px' }}>{bootMessage}</div>
    </div>
  );

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Router>
        <div className="App">
          {user && <Navbar user={user} onLogout={handleLogout} />}
          <Routes>
            <Route
              path="/"
              element={user ? <DashboardPage /> : <LoginPage onLogin={handleLogin} />}
            />
            <Route
              path="/groups/:groupId"
              element={user ? <GroupPage /> : <Navigate to="/" />}
            />
            <Route
              path="/groups/:groupId/player/:playerId"
              element={user ? <PlayerStatsPage /> : <Navigate to="/" />}
            />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
