import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './PlayerStatsPage.css';

function PlayerStatsPage() {
  const { groupId, playerId } = useParams();
  const navigate = useNavigate();
  const playerIdNum = parseInt(playerId);
  const [player, setPlayer] = useState(null);
  const [standings, setStandings] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlayerStats();
  }, [groupId, playerId]);

  const fetchPlayerStats = async () => {
    try {
      setLoading(true);

      // Obtener información del jugador
      const playerRes = await api.get(`/groups/${groupId}/members`);
      const playerData = playerRes.data.find(m => m.id === playerIdNum);

      if (!playerData) {
        setError('Jugador no encontrado');
        setLoading(false);
        return;
      }

      // Obtener standings del grupo
      const standingsRes = await api.get(`/groups/${groupId}/standings`);
      const playerStanding = standingsRes.data.find(s => s.id === playerIdNum);

      // Obtener partidos del grupo
      const matchesRes = await api.get(`/matches/groups/${groupId}`);
      setMatches(matchesRes.data || []);

      setPlayer(playerData);
      setStandings(playerStanding);
    } catch (err) {
      console.error('Error fetching player stats:', err);
      setError(`Error cargando estadísticas: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Cargando estadísticas...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!player) return <div className="error-message">Jugador no encontrado</div>;

  return (
    <div className="player-stats-page">
      <button className="btn-back" onClick={() => navigate(-1)}>← Volver</button>

      <div className="player-header">
        <img src={player.picture_url} alt={player.name} className="player-photo" />
        <div className="player-info">
          <h1>{player.name}</h1>
          <p className="player-email">{player.email}</p>
        </div>
      </div>

      {standings && (
        <div className="stats-summary">
          <div className="stat-card">
            <div className="stat-label">Posición</div>
            <div className="stat-value">#{standings.id ? '🏆' : '-'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Predicciones Totales</div>
            <div className="stat-value">{standings.total_predictions || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Acertadas</div>
            <div className="stat-value success">{standings.correct_predictions || 0}</div>
          </div>
          {standings.total_predictions > 0 && (
            <div className="stat-card">
              <div className="stat-label">% Acierto</div>
              <div className="stat-value">
                {((standings.correct_predictions / standings.total_predictions) * 100).toFixed(1)}%
              </div>
            </div>
          )}
          <div className="stat-card">
            <div className="stat-label">Puntos</div>
            <div className="stat-value primary">{standings.points || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Promedio Rating</div>
            <div className="stat-value">
              {standings.average_rating > 0 ? (parseFloat(standings.average_rating) || 0).toFixed(1) : '-'} ⭐
            </div>
          </div>
        </div>
      )}

      <div className="matches-stats">
        <h2>Partidos del Grupo</h2>
        {matches.length === 0 ? (
          <p className="no-data">Sin partidos en este grupo</p>
        ) : (
          <div className="matches-list-simple">
            {matches.map((match) => {
              const matchDate = match.date ? new Date(match.date) : null;
              const dateStr = matchDate && !isNaN(matchDate.getTime())
                ? matchDate.toLocaleString('es-AR')
                : 'Fecha no disponible';

              return (
                <div key={match.id} className="match-item-simple">
                  <div className="match-info-simple">
                    <h3>{match.name}</h3>
                    <p className="match-date">{dateStr}</p>
                  </div>
                  <div className="match-status-simple">
                    <span className={`status-badge status-${match.status || 'draft'}`}>
                      {match.status === 'voting' ? 'En votación' :
                       match.status === 'resolved' ? 'Finalizado' :
                       match.status === 'active' ? 'Activo' : 'Borrador'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="info-box">
        <p>💡 Se están desarrollando estadísticas detalladas por partido.</p>
      </div>
    </div>
  );
}

export default PlayerStatsPage;
