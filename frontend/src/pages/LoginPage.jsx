import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import './LoginPage.css';

function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/google', {
        token: credentialResponse.credential,
      });
      onLogin(response.data.token);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Error during login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed');
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      onLogin(response.data.token);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Error during login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        name
      });
      onLogin(response.data.token);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Error durante el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>⚽ Fútbol Champagne</h1>
        <p>Fantasy Fútbol para amigos</p>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Ingresar
          </button>
          <button
            className={`tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Registrarse
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleEmailLogin} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>
        )}

        {/* Google Login */}
        <div className="divider">O</div>
        <div className="login-button">
          {loading ? (
            <p>Procesando...</p>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
