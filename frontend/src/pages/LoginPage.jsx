import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import './LoginPage.css';

function LoginPage({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>⚽ El Bidón</h1>
        <p>Fantasy Fútbol para amigos</p>
        {error && <div className="error-message">{error}</div>}
        <div className="login-button">
          {loading ? (
            <p>Logging in...</p>
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
