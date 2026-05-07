import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../services/api';
import './LoginPage.css';

function LoginPage({ onLogin }) {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await api.post('/auth/google', {
        token: credentialResponse.credential,
      });
      onLogin(response.data.token);
    } catch (error) {
      console.error('Login error:', error);
      alert('Error during login');
    }
  };

  const handleGoogleError = () => {
    alert('Login failed');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>⚽ El Bidón</h1>
        <p>Fantasy Fútbol para amigos</p>
        <div className="login-button">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
          />
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
