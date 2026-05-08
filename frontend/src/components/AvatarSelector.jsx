import React, { useState } from 'react';
import api from '../services/api';
import './AvatarSelector.css';

const EMOJI_AVATARS = [
  '⚽', '🐱', '🐶', '🦁', '🐸', '🦄', '🎭', '😎',
  '🧙', '🧗', '🏃', '⛹️', '🤸', '🧘', '🎮', '🎯',
  '🌟', '💎', '👑', '🏆', '🎪', '🚀', '🎨', '🎸',
  '🎬', '📚', '🍕', '🍔', '🌮', '⛳', '🎲', '🎳'
];

// === SUBIDA DE FOTOS DE PERFIL ===
// Cambiar a true para reactivar la opción de subir foto.
// Requiere: endpoint /auth/avatar/upload activo en el backend
//           + storage configurado (Cloudinary/S3 recomendado en producción)
const PHOTO_UPLOAD_ENABLED = false;

function AvatarSelector({ currentAvatar, onAvatarChange, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || '⚽');
  const [activeTab, setActiveTab] = useState('emoji');

  const handleEmojiSelect = async (emoji) => {
    setSelectedAvatar(emoji);
    setLoading(true);
    setError(null);
    try {
      await api.put('/auth/avatar', { avatar: emoji });
      onAvatarChange(emoji);
      onClose?.();
    } catch (err) {
      setError('Error al cambiar avatar');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5MB');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/auth/avatar/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onAvatarChange(response.data);
      onClose?.();
    } catch (err) {
      setError('Error al subir la foto');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="avatar-selector">
      <div className="avatar-selector-header">
        <h3>Seleccionar Avatar</h3>
        {error && <p className="error-text">{error}</p>}
      </div>

      {PHOTO_UPLOAD_ENABLED && (
        <div className="avatar-tabs">
          <button
            className={`avatar-tab ${activeTab === 'emoji' ? 'active' : ''}`}
            onClick={() => setActiveTab('emoji')}
            disabled={loading}
          >
            😀 Emoji
          </button>
          <button
            className={`avatar-tab ${activeTab === 'photo' ? 'active' : ''}`}
            onClick={() => setActiveTab('photo')}
            disabled={loading}
          >
            📷 Foto
          </button>
        </div>
      )}

      {activeTab === 'emoji' && (
        <>
          <div className="avatar-preview">
            <span className="avatar-emoji">{selectedAvatar}</span>
          </div>

          <div className="emoji-grid">
            {EMOJI_AVATARS.map((emoji) => (
              <button
                key={emoji}
                className={`emoji-button ${selectedAvatar === emoji ? 'selected' : ''}`}
                onClick={() => handleEmojiSelect(emoji)}
                disabled={loading}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}

      {PHOTO_UPLOAD_ENABLED && activeTab === 'photo' && (
        <div className="photo-upload-section">
          <label className="photo-upload-label">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={loading}
              className="photo-upload-input"
            />
            <div className="photo-upload-area">
              <div className="photo-upload-icon">📷</div>
              <div className="photo-upload-text">
                {loading ? 'Subiendo...' : 'Click para seleccionar una foto'}
              </div>
              <div className="photo-upload-hint">PNG, JPG o GIF (máx 5MB)</div>
            </div>
          </label>
        </div>
      )}

      {onClose && (
        <button className="btn-close-modal" onClick={onClose} disabled={loading}>
          Cerrar
        </button>
      )}
    </div>
  );
}

export default AvatarSelector;
