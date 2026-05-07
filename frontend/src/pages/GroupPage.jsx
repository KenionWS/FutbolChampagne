import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { groupsApi } from '../services/groupsApi';
import { matchesApi } from '../services/matchesApi';
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

      const matchesRes = await matchesApi.getGroupMatches(groupId);
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
          groupId={parseInt(groupId)}
          onClose={() => setSelectedMatch(null)}
          onUpdate={() => fetchGroupData()}
        />
      )}
    </div>
  );
}

function MatchModal({ match, groupId, onClose, onUpdate }) {
  const [predictions, setPredictions] = useState([]);
  const [myPredictions, setMyPredictions] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPredictionText, setNewPredictionText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchMatchData();
    fetchCategories();
  }, [match.id]);

  const fetchMatchData = async () => {
    try {
      setLoading(true);
      const predsRes = await matchesApi.getMatchPredictions(match.id);
      setPredictions(predsRes.data);

      const myPdsRes = await matchesApi.getMyPredictions(match.id);
      const myPdsMap = {};
      myPdsRes.data.forEach((pd) => {
        myPdsMap[pd.category_id] = pd.prediction_text;
      });
      setMyPredictions(myPdsMap);
    } catch (err) {
      console.error('Error loading predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      // Aquí deberíamos cargar categorías, por ahora mostramos ejemplos
      setCategories([
        { id: 1, name: 'Goleador' },
        { id: 2, name: 'Asistencia' },
        { id: 3, name: 'Mejor gol' },
      ]);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleMakePrediction = async () => {
    if (!selectedCategory || !newPredictionText.trim()) return;

    try {
      await matchesApi.makePrediction(
        match.id,
        selectedCategory,
        newPredictionText
      );
      setNewPredictionText('');
      setSelectedCategory('');
      fetchMatchData();
    } catch (err) {
      alert('Error making prediction');
    }
  };

  const handleVote = async (predictionId, resolved) => {
    try {
      await matchesApi.votePrediction(predictionId, resolved);
      fetchMatchData();
    } catch (err) {
      alert('Error voting');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="match-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>{match.opponent_name}</h2>
        <p className="match-date">
          {new Date(match.match_date).toLocaleString('es-AR')}
        </p>
        <span className={`status status-${match.status}`}>
          {match.status}
        </span>

        <div className="modal-content">
          {match.status === 'draft' && (
            <div className="predictions-section">
              <h3>Haz tu predicción</h3>
              <div className="prediction-form">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Selecciona categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Tu predicción..."
                  value={newPredictionText}
                  onChange={(e) => setNewPredictionText(e.target.value)}
                />
                <button
                  onClick={handleMakePrediction}
                  className="btn-submit"
                >
                  Predecir
                </button>
              </div>

              {predictions.length > 0 && (
                <div className="predictions-list">
                  <h4>Predicciones</h4>
                  {predictions.map((pred) => (
                    <div key={pred.id} className="prediction-item">
                      <div className="prediction-text">
                        <strong>{pred.user_name}</strong>:{' '}
                        {pred.prediction_text}
                        <small> ({pred.category_name})</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {match.status === 'voting' && (
            <div className="voting-section">
              <h3>Vota si acertaron</h3>
              {predictions.length > 0 ? (
                <div className="predictions-list">
                  {predictions.map((pred) => (
                    <div key={pred.id} className="prediction-vote">
                      <div className="prediction-text">
                        <strong>{pred.user_name}</strong>: {pred.prediction_text}
                        <small> ({pred.category_name})</small>
                      </div>
                      <div className="vote-buttons">
                        <button
                          className="btn-yes"
                          onClick={() => handleVote(pred.id, true)}
                        >
                          ✓ Acertó
                        </button>
                        <button
                          className="btn-no"
                          onClick={() => handleVote(pred.id, false)}
                        >
                          ✗ No
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No hay predicciones</p>
              )}
            </div>
          )}

          {match.status === 'resolved' && (
            <div className="results-section">
              <h3>Resultados</h3>
              {predictions.length > 0 ? (
                <div className="predictions-list">
                  {predictions.map((pred) => (
                    <div key={pred.id} className="prediction-result">
                      <strong>{pred.user_name}</strong>: {pred.prediction_text}
                      <small> ({pred.category_name})</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No hay predicciones</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupPage;
