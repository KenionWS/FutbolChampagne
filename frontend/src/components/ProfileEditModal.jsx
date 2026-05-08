import React, { useState } from 'react';
import api from '../services/api';
import './ProfileEditModal.css';

function ProfileEditModal({ user, onClose, onProfileUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    nickname: user?.nickname || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.put('/auth/profile', formData);
      onProfileUpdate(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar perfil');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-edit-modal">
      <div className="profile-edit-header">
        <h3>Editar Perfil</h3>
        {error && <p className="error-text">{error}</p>}
      </div>

      <form onSubmit={handleSubmit} className="profile-edit-form">
        <div className="form-group">
          <label htmlFor="name">Nombre *</label>
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Tu nombre"
          />
        </div>

        <div className="form-group">
          <label htmlFor="surname">Apellido</label>
          <input
            id="surname"
            type="text"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            disabled={loading}
            placeholder="Tu apellido"
          />
        </div>

        <div className="form-group">
          <label htmlFor="nickname">Apodo/Sobrenombre</label>
          <input
            id="nickname"
            type="text"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            disabled={loading}
            placeholder="Tu apodo (ej: El Crack)"
          />
        </div>

        <div className="profile-edit-actions">
          <button
            type="submit"
            className="btn-save"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfileEditModal;
