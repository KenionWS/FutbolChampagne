import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { groupsApi } from '../services/groupsApi';
import api from '../services/api';
import './GroupPage.css';

function GroupPage() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('matches');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const groupRes = await groupsApi.getGroup(parseInt(groupId));
      setGroup(groupRes.data);

      const matchesRes = await api.get(`/matches/groups/${groupId}`);
      setMatches(matchesRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading group');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container group-page"><p>Loading...</p></div>;
  if (error) return <div className="container group-page"><p className="error-message">{error}</p></div>;

  const copyCode = () => {
    navigator.clipboard.writeText(group?.invite_code);
    alert('Código copiado!');
  };

  return (
    <div className="container group-page">
      <div className="group-header">
        <div className="header-top">
          <h2>{group?.name}</h2>
          <div className="invite-code-box">
            <span className="label">Código:</span>
            <code>{group?.invite_code}</code>
            <button className="copy-btn" onClick={copyCode}>
              Copiar
            </button>
          </div>
        </div>
        <div className="group-tabs">
          <button
            className={`tab ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            Partidos
          </button>
          <button
            className={`tab ${activeTab === 'standings' ? 'active' : ''}`}
            onClick={() => setActiveTab('standings')}
          >
            Posiciones
          </button>
          <button
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Miembros
          </button>
        </div>
      </div>

      <div className="group-content">
        {activeTab === 'matches' && (
          <div className="matches-section">
            {matches.length === 0 ? (
              <p>No hay partidos aún</p>
            ) : (
              <div className="matches-list">
                {matches.map((match) => (
                  <div
                    key={match.id}
                    className="match-card"
                    onClick={() => setSelectedMatch(match)}
                  >
                    <h3>{match.opponent_name}</h3>
                    <p>
                      {new Date(match.match_date).toLocaleDateString('es-AR')}
                    </p>
                    <span className={`status status-${match.status}`}>
                      {match.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'standings' && (
          <div className="standings-section">
            <p>Tabla de posiciones (próximamente)</p>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="members-section">
            <p>Miembros del grupo (próximamente)</p>
          </div>
        )}
      </div>

      {selectedMatch && (
        <MatchModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}

function MatchModal({ match, onClose }) {
  const [predictions, setPredictions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatchData();
  }, [match.id]);

  const fetchMatchData = async () => {
    try {
      setLoading(true);
      // Aquí se cargarían las predicciones y categorías
      // const predsRes = await api.get(`/matches/${match.id}/predictions`);
      // setPredictions(predsRes.data);
    } catch (err) {
      console.error('Error loading match data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="match-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>{match.opponent_name}</h2>
        <p>{new Date(match.match_date).toLocaleString('es-AR')}</p>
        <p>Estado: {match.status}</p>
        <div className="modal-content">
          {match.status === 'draft' && (
            <div>
              <h3>Haz tu predicción</h3>
              <p>(Predicciones próximamente)</p>
            </div>
          )}
          {match.status === 'voting' && (
            <div>
              <h3>Vota las predicciones</h3>
              <p>(Votación próximamente)</p>
            </div>
          )}
          {match.status === 'resolved' && (
            <div>
              <h3>Resultados</h3>
              <p>(Resultados próximamente)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupPage;
