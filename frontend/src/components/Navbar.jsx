import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarSelector from './AvatarSelector';
import ProfileEditModal from './ProfileEditModal';

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [userData, setUserData] = useState(user);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleAvatarChange = (updatedUser) => {
    if (typeof updatedUser === 'string') {
      // Es un emoji
      setUserData({ ...userData, avatar: updatedUser, picture_url: null });
    } else {
      // Es un objeto user completo (subida de foto)
      setUserData({ ...userData, ...updatedUser });
    }
    setShowAvatarSelector(false);
  };

  const handleProfileUpdate = (updatedUser) => {
    setUserData({ ...userData, ...updatedUser });
    setShowProfileEdit(false);
  };

  const displayName = userData?.nickname || userData?.name || user?.name || 'Usuario';

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <svg className="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            {/* Cancha de fútbol */}
            <rect width="100" height="100" fill="#1B5E20" rx="4"/>
            {/* Líneas de cancha */}
            <line x1="50" y1="0" x2="50" y2="100" stroke="#D4AF37" strokeWidth="1.5"/>
            <circle cx="50" cy="50" r="8" fill="none" stroke="#D4AF37" strokeWidth="1.5"/>
            {/* Pelota */}
            <circle cx="50" cy="50" r="6" fill="#FFFFFF"/>
            <line x1="44" y1="50" x2="56" y2="50" stroke="#1B5E20" strokeWidth="0.5"/>
            <line x1="50" y1="44" x2="50" y2="56" stroke="#1B5E20" strokeWidth="0.5"/>
          </svg>
          <h1>Fútbol Champagne</h1>
        </div>
        <div className="navbar-actions">
          <div className="user-section">
            <button
              className="avatar-button"
              onClick={() => setShowAvatarSelector(true)}
              title="Cambiar avatar"
            >
              {userData?.picture_url ? (
                <img src={userData.picture_url} alt="Avatar" className="avatar-photo" />
              ) : (
                <span className="avatar-display">{userData?.avatar || '⚽'}</span>
              )}
            </button>
            <div className="user-info">
              <span className="user-name" onClick={() => setShowProfileEdit(true)} style={{ cursor: 'pointer' }}>
                {displayName}
              </span>
              {userData?.surname && (
                <span className="user-surname">{userData.surname}</span>
              )}
            </div>
          </div>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      {showAvatarSelector && (
        <div className="modal-overlay" onClick={() => setShowAvatarSelector(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <AvatarSelector
              currentAvatar={userData?.avatar}
              onAvatarChange={handleAvatarChange}
              onClose={() => setShowAvatarSelector(false)}
            />
          </div>
        </div>
      )}

      {showProfileEdit && (
        <div className="modal-overlay" onClick={() => setShowProfileEdit(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <ProfileEditModal
              user={userData}
              onClose={() => setShowProfileEdit(false)}
              onProfileUpdate={handleProfileUpdate}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
