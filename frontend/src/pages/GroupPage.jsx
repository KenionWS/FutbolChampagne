import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsApi } from '../services/groupsApi';
import { matchesApi } from '../services/matchesApi';
import api from '../services/api';
import './GroupPage.css';

function GroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('matches');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchGroupData();
  }, [groupId]);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      const groupRes = await groupsApi.getGroup(parseInt(groupId));
      setGroup(groupRes.data);

      const userRes = await api.get('/auth/me');
      setUser(userRes.data);

      const matchesRes = await matchesApi.getGroupMatches(groupId);
      setMatches(matchesRes.data);

      const membersRes = await groupsApi.getGroupMembers(parseInt(groupId));
      setGroupMembers(membersRes.data);

      const standingsRes = await api.get(`/groups/${groupId}/standings`);
      setStandings(standingsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading group');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (opponentName, matchDate) => {
    try {
      await api.post(`/matches/groups/${groupId}`, {
        opponentName,
        matchDate,
      });
      setShowCreateMatchModal(false);
      fetchGroupData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating match');
    }
  };

  if (loading) return <div className="container group-page"><p>Loading...</p></div>;
  if (error) return <div className="container group-page"><p className="error-message">{error}</p></div>;

  const copyCode = () => {
    navigator.clipboard.writeText(group?.invite_code);
    alert('Código copiado!');
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('¿Estás seguro de que quieres abandonar el grupo?')) return;
    try {
      await api.post(`/groups/${groupId}/leave`);
      window.location.href = '/groups';
    } catch (err) {
      alert(err.response?.data?.error || 'Error al abandonar el grupo');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este miembro?')) return;
    try {
      await api.delete(`/groups/${groupId}/members/${memberId}`);
      fetchGroupData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar el miembro');
    }
  };

  return (
    <div className="container group-page">
      <div className="group-header">
        <div className="header-top">
          <div>
            <h2>{group?.name}</h2>
            {user?.id === group?.admin_id && (
              <p className="admin-badge">👑 Eres admin</p>
            )}
          </div>
          <div className="header-right">
            {user?.id === group?.admin_id && (
              <button
                className="btn-create-match"
                onClick={() => setShowCreateMatchModal(true)}
              >
                + Crear Partido
              </button>
            )}
            <div className="invite-code-box">
              <span className="label">Código:</span>
              <code>{group?.invite_code}</code>
              <button className="copy-btn" onClick={copyCode}>
                Copiar
              </button>
            </div>
            <div className="group-menu">
              <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>⋮</button>
              {showMenu && (
                <div className="menu-dropdown">
                  <button onClick={handleLeaveGroup} className="menu-item leave-item">
                    Abandonar grupo
                  </button>
                </div>
              )}
            </div>
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
            {standings.length === 0 ? (
              <p>No hay datos de posiciones aún</p>
            ) : (
              <div className="standings-table">
                <div className="standings-header">
                  <div className="col-position">Pos</div>
                  <div className="col-player">Jugador</div>
                  <div className="col-stats">Puntos</div>
                  <div className="col-stats">Aciertos</div>
                  <div className="col-stats">Promedio</div>
                </div>
                {standings.map((player, index) => (
                  <div
                    key={player.id}
                    className="standings-row"
                    onClick={() => navigate(`/groups/${groupId}/player/${player.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="col-position">
                      <span className="position-badge">{index + 1}</span>
                    </div>
                    <div className="col-player">
                      {player.picture_url && (
                        <img src={player.picture_url} alt={player.name} />
                      )}
                      <span>{player.name}</span>
                    </div>
                    <div className="col-stats points">{player.points}</div>
                    <div className="col-stats">
                      {player.correct_predictions}/{player.total_predictions}
                    </div>
                    <div className="col-stats">
                      {player.average_rating > 0 ? (parseFloat(player.average_rating) || 0).toFixed(1) : '-'} ⭐
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className="members-section">
            {groupMembers.length === 0 ? (
              <p>No hay miembros</p>
            ) : (
              <div className="members-list">
                {groupMembers.map((member) => (
                  <div
                    key={member.id}
                    className="member-card"
                    onClick={() => navigate(`/groups/${groupId}/player/${member.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {member.picture_url && (
                      <img src={member.picture_url} alt={member.name} />
                    )}
                    <div className="member-info">
                      <h4>{member.name}</h4>
                      <p>{member.email}</p>
                      <small>
                        Unido: {new Date(member.joined_at).toLocaleDateString('es-AR')}
                      </small>
                    </div>
                    {user?.id === group?.admin_id && user?.id !== member.id && (
                      <button
                        className="btn-delete-member"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMember(member.id);
                        }}
                        title="Eliminar miembro"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedMatch && (
        <MatchModal
          match={selectedMatch}
          group={group}
          groupId={parseInt(groupId)}
          members={groupMembers}
          user={user}
          onClose={() => setSelectedMatch(null)}
          onUpdate={() => fetchGroupData()}
        />
      )}

      {showCreateMatchModal && (
        <CreateMatchModal
          onClose={() => setShowCreateMatchModal(false)}
          onCreate={handleCreateMatch}
        />
      )}
    </div>
  );
}

function CreateMatchModal({ onClose, onCreate }) {
  const [opponentName, setOpponentName] = useState('');
  const [matchDate, setMatchDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!opponentName.trim() || !matchDate) {
      alert('Completa todos los campos');
      return;
    }
    onCreate(opponentName, matchDate);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="match-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>Crear Nuevo Partido</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rival</label>
            <input
              type="text"
              placeholder="Ej: Amigos del barrio"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Fecha y hora</label>
            <input
              type="datetime-local"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn-submit">
              Crear
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MatchModal({ match, group, groupId, members = [], user: propUser, onClose, onUpdate }) {
  const [predictions, setPredictions] = useState([]);
  const [myPredictions, setMyPredictions] = useState({});
  const [categories, setCategories] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ opponentName: match.opponent_name, matchDate: '' });
  const [newPredictionText, setNewPredictionText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [user, setUser] = useState(propUser);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [playerStatsInput, setPlayerStatsInput] = useState({});
  const [editingPredictionId, setEditingPredictionId] = useState(null);
  const [editingPredictionText, setEditingPredictionText] = useState('');
  const [votes, setVotes] = useState({});
  const [voteResults, setVoteResults] = useState({});
  const [playerRatings, setPlayerRatings] = useState({});
  const [myPlayerRatings, setMyPlayerRatings] = useState({});
  const [predictionResults, setPredictionResults] = useState({});

  const matchPassed = new Date(match.match_date) < new Date();
  const canVote = !matchPassed && match.status === 'voting';

  useEffect(() => {
    const loadData = async () => {
      await fetchCategories();
      await fetchMatchData();
      await fetchUser();
      await fetchPlayerStats();
    };
    loadData();

    // Format match date for edit input
    const date = new Date(match.match_date);
    const isoDate = date.toISOString().slice(0, 16);
    setEditData({ opponentName: match.opponent_name, matchDate: isoDate });
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

      // Fetch categories first if not loaded
      let catsToUse = categories;
      if (!categories || categories.length === 0) {
        try {
          const catsRes = await api.get(`/groups/${groupId}/categories`);
          catsToUse = catsRes.data;
          setCategories(catsRes.data);
        } catch (err) {
          console.error('Error loading categories:', err);
          catsToUse = [];
        }
      }

      // Fetch voting results for all categories
      if (catsToUse.length > 0) {
        const votingPromises = catsToUse.map((cat) =>
          api.get(`/matches/${match.id}/${cat.id}/vote-results`)
            .then((res) => ({ categoryId: cat.id, data: res.data }))
            .catch(() => ({ categoryId: cat.id, data: [] }))
        );
        const votingResults = await Promise.all(votingPromises);
        const voteMap = {};
        votingResults.forEach((result) => {
          voteMap[result.categoryId] = result.data;
        });
        setVoteResults(voteMap);
      }

      // Fetch player ratings
      const ratingsRes = await api.get(`/matches/${match.id}/player-ratings`).catch(() => ({ data: [] }));
      setPlayerRatings(ratingsRes.data);

      const myRatingsRes = await api.get(`/matches/${match.id}/my-player-ratings`).catch(() => ({ data: [] }));
      const myRatingsMap = {};
      myRatingsRes.data.forEach((rating) => {
        myRatingsMap[rating.player_id] = rating.rating;
      });
      setMyPlayerRatings(myRatingsMap);
    } catch (err) {
      console.error('Error loading predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get(`/groups/${groupId}/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const fetchUser = async () => {
    if (!user) {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Error loading user:', err);
      }
    }
  };

  const handleEditMatch = async () => {
    if (!editData.opponentName.trim() || !editData.matchDate) return;

    try {
      await api.patch(`/matches/${match.id}`, {
        opponentName: editData.opponentName,
        matchDate: editData.matchDate,
      });
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      alert('Error editing match');
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

  const handleVote = async (categoryId, playerVotedForId) => {
    try {
      await api.post(`/matches/${match.id}/vote`, {
        categoryId,
        playerVotedForId: playerVotedForId || null,
      });
      const updatedVotes = { ...votes, [categoryId]: playerVotedForId };
      setVotes(updatedVotes);
      fetchMatchData();
    } catch (err) {
      console.error('Vote error:', err);
      alert(err.response?.data?.error || 'Error voting');
    }
  };

  const handleSavePlayerRatings = async () => {
    try {
      const ratings = members.map((member) => ({
        playerId: member.id,
        rating: myPlayerRatings[member.id] || 5,
      }));
      await api.post(`/matches/${match.id}/player-ratings`, { ratings });
      alert('Calificaciones guardadas!');
      fetchMatchData();
    } catch (err) {
      console.error('Save ratings error:', err);
      alert(err.response?.data?.error || 'Error saving ratings');
    }
  };

  const handleFinalizePredictions = async () => {
    if (!window.confirm('¿Estás seguro de finalizar la votación?')) return;
    try {
      await api.post(`/matches/${match.id}/finalize-voting`, { groupId });
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Error finalizing predictions');
    }
  };

  const isAdmin = user?.id === group?.admin_id;

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await api.post(`/groups/${groupId}/categories`, {
        name: newCategoryName,
      });
      setNewCategoryName('');
      setShowNewCategoryForm(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating category');
    }
  };

  const handleChangeMatchStatus = async (newStatus) => {
    try {
      await api.patch(`/matches/${match.id}/status`, { status: newStatus });
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.error || 'Error changing status');
    }
  };

  const fetchPlayerStats = async () => {
    try {
      const res = await api.get(`/matches/${match.id}/player-stats`);
      setPlayerStats(res.data);
    } catch (err) {
      console.error('Error loading player stats:', err);
    }
  };

  const handleSavePlayerStats = async (playerId) => {
    try {
      const stats = playerStatsInput[playerId] || {};
      await api.post(`/matches/${match.id}/player-stats`, {
        groupId,
        playerId,
        goals: stats.goals || 0,
        saves: stats.saves || 0,
      });
      setPlayerStatsInput({ ...playerStatsInput, [playerId]: {} });
      fetchPlayerStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving stats');
    }
  };

  const handleDeletePrediction = async (predictionId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta predicción?')) return;
    try {
      await api.delete(`/matches/predictions/${predictionId}`, {
        data: { groupId }
      });
      fetchMatchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error deleting prediction');
    }
  };

  const handleEditPrediction = async (predictionId, newText) => {
    try {
      await api.patch(`/matches/predictions/${predictionId}`, {
        groupId,
        predictionText: newText,
      });
      setEditingPredictionId(null);
      fetchMatchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error updating prediction');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="match-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="match-header">
          <div>
            <h2>{match.opponent_name}</h2>
            <p className="match-date">
              {new Date(match.match_date).toLocaleString('es-AR')}
            </p>
          </div>
          <div className="match-actions">
            {isAdmin && !isEditing && (
              <button className="btn-edit" onClick={() => setIsEditing(true)}>
                ✏️ Editar
              </button>
            )}
          </div>
        </div>
        <div className="match-status-bar">
          <span className={`status status-${match.status}`}>
            {match.status === 'draft' && 'Predicciones'}
            {match.status === 'voting' && 'Votación'}
            {match.status === 'resolved' && 'Finalizado'}
          </span>
          {isAdmin && (
            <div className="status-buttons">
              {match.status === 'draft' && (
                <button
                  className="btn-status"
                  onClick={() => handleChangeMatchStatus('voting')}
                >
                  Marcar como jugado
                </button>
              )}
              {match.status === 'voting' && (
                <button
                  className="btn-status"
                  onClick={() => handleChangeMatchStatus('resolved')}
                >
                  Finalizar votación
                </button>
              )}
            </div>
          )}
        </div>

        {isEditing && isAdmin && (
          <div className="edit-form">
            <input
              type="text"
              value={editData.opponentName}
              onChange={(e) =>
                setEditData({ ...editData, opponentName: e.target.value })
              }
              placeholder="Nombre del rival"
            />
            <input
              type="datetime-local"
              value={editData.matchDate}
              onChange={(e) =>
                setEditData({ ...editData, matchDate: e.target.value })
              }
            />
            <div className="edit-buttons">
              <button className="btn-save" onClick={handleEditMatch}>
                Guardar
              </button>
              <button
                className="btn-cancel"
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="modal-content">
          {match.status === 'draft' && (
            <div className="predictions-section">
              <h3>Haz tu predicción</h3>

              {isAdmin && (
                <div className="create-category-section">
                  {!showNewCategoryForm ? (
                    <button
                      className="btn-add-category"
                      onClick={() => setShowNewCategoryForm(true)}
                    >
                      + Agregar categoría
                    </button>
                  ) : (
                    <div className="new-category-form">
                      <input
                        type="text"
                        placeholder="Nombre de la categoría"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        autoFocus
                      />
                      <div className="category-form-buttons">
                        <button
                          className="btn-save"
                          onClick={handleCreateCategory}
                        >
                          Crear
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => {
                            setShowNewCategoryForm(false);
                            setNewCategoryName('');
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                >
                  <option value="">Selecciona jugador</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (selectedMember && selectedCategory) {
                      const member = members.find(
                        (m) => m.id === parseInt(selectedMember)
                      );
                      setNewPredictionText(member.name);
                      handleMakePrediction();
                      setSelectedMember('');
                    }
                  }}
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
                      {editingPredictionId === pred.id && isAdmin ? (
                        <div className="prediction-edit-form">
                          <input
                            type="text"
                            value={editingPredictionText}
                            onChange={(e) => setEditingPredictionText(e.target.value)}
                            autoFocus
                          />
                          <div className="prediction-edit-buttons">
                            <button
                              className="btn-save"
                              onClick={() => handleEditPrediction(pred.id, editingPredictionText)}
                            >
                              Guardar
                            </button>
                            <button
                              className="btn-cancel"
                              onClick={() => setEditingPredictionId(null)}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="prediction-text">
                            <strong>{pred.user_name}</strong>:{' '}
                            {pred.prediction_text}
                            <small> ({pred.category_name})</small>
                          </div>
                          {isAdmin && (
                            <div className="prediction-actions">
                              <button
                                className="btn-edit-small"
                                onClick={() => {
                                  setEditingPredictionId(pred.id);
                                  setEditingPredictionText(pred.prediction_text);
                                }}
                              >
                                ✏️
                              </button>
                              <button
                                className="btn-delete-small"
                                onClick={() => handleDeletePrediction(pred.id)}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {isAdmin && (
                <div className="player-stats-section">
                  <h4>Estadísticas de jugadores</h4>
                  <div className="player-stats-form">
                    {members.map((member) => (
                      <div key={member.id} className="player-stat-row">
                        <div className="player-info">
                          {member.picture_url && (
                            <img src={member.picture_url} alt={member.name} />
                          )}
                          <span>{member.name}</span>
                        </div>
                        <div className="player-stat-inputs">
                          <input
                            type="number"
                            placeholder="Goles"
                            min="0"
                            value={playerStatsInput[member.id]?.goals || ''}
                            onChange={(e) =>
                              setPlayerStatsInput({
                                ...playerStatsInput,
                                [member.id]: {
                                  ...playerStatsInput[member.id],
                                  goals: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                          />
                          <input
                            type="number"
                            placeholder="Buenas atajadas"
                            min="0"
                            value={playerStatsInput[member.id]?.saves || ''}
                            onChange={(e) =>
                              setPlayerStatsInput({
                                ...playerStatsInput,
                                [member.id]: {
                                  ...playerStatsInput[member.id],
                                  saves: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                          />
                          <button
                            className="btn-save-stats"
                            onClick={() => handleSavePlayerStats(member.id)}
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {playerStats.length > 0 && (
                    <div className="player-stats-display">
                      <h5>Estadísticas registradas</h5>
                      {playerStats.map((stat) => (
                        <div key={stat.player_id} className="stat-row">
                          {stat.picture_url && (
                            <img src={stat.picture_url} alt={stat.player_name} />
                          )}
                          <span>{stat.player_name}</span>
                          <div className="stat-values">
                            <span>{stat.goals} goles</span>
                            <span>{stat.saves} atajadas</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {match.status === 'voting' && (
            <div className="voting-section">
              <h3>¿Quién lo hizo?</h3>
              {matchPassed ? (
                <p className="warning-message">
                  ⚠️ La fecha del partido ya pasó, no se puede votar
                </p>
              ) : (
                <>
                  {predictions.length > 0 && (
                    <div className="voting-categories">
                      {categories
                        .filter((cat) => predictions.some((p) => p.category_id === cat.id))
                        .map((category) => {
                          const categoryPredictions = predictions.filter(
                            (p) => p.category_id === category.id
                          );
                          return (
                            <div key={category.id} className="voting-category-card">
                              <h4>{category.name}</h4>
                              <div className="category-predictions">
                                {categoryPredictions.map((pred) => (
                                  <p key={pred.id} className="prediction-item">
                                    <strong>{pred.user_name}</strong>: {pred.prediction_text}
                                  </p>
                                ))}
                              </div>
                            {canVote && (
                              <div className="voting-options">
                                {members.map((member) => (
                                  <button
                                    key={member.id}
                                    className={`vote-option ${
                                      votes[category.id] === member.id ? 'selected' : ''
                                    }`}
                                    onClick={() => handleVote(category.id, member.id)}
                                  >
                                    {member.picture_url && (
                                      <img src={member.picture_url} alt={member.name} />
                                    )}
                                    <span>{member.name}</span>
                                  </button>
                                ))}
                                <button
                                  className={`vote-option ${
                                    votes[category.id] === null ? 'selected' : ''
                                  }`}
                                  onClick={() => handleVote(category.id, null)}
                                >
                                  <span>Otro</span>
                                </button>
                              </div>
                            )}
                            {voteResults[category.id]?.length > 0 && (
                              <div className="voting-results">
                                <h5>Resultados</h5>
                                {voteResults[category.id].map((result, idx) => (
                                  <div key={idx} className="result-bar">
                                    {result.picture_url && (
                                      <img src={result.picture_url} alt={result.player_name} />
                                    )}
                                    <span className="result-name">
                                      {result.player_name || 'Otro'}
                                    </span>
                                    <div className="result-bar-container">
                                      <div
                                        className="result-bar-fill"
                                        style={{ width: `${result.percentage}%` }}
                                      />
                                    </div>
                                    <span className="result-percentage">
                                      {result.vote_count} ({result.percentage}%)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {canVote && (
                    <div className="player-ratings-section">
                      <h3>Calificar jugadores</h3>
                      <div className="player-ratings-grid">
                        {members.map((member) => (
                          <div key={member.id} className="rating-card">
                            {member.picture_url && (
                              <img src={member.picture_url} alt={member.name} />
                            )}
                            <h5>{member.name}</h5>
                            <div className="rating-input">
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={myPlayerRatings[member.id] || 5}
                                onChange={(e) =>
                                  setMyPlayerRatings({
                                    ...myPlayerRatings,
                                    [member.id]: parseInt(e.target.value),
                                  })
                                }
                              />
                              <span className="rating-value">
                                {myPlayerRatings[member.id] || 5} ⭐
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="btn-save-ratings" onClick={handleSavePlayerRatings}>
                        Guardar calificaciones
                      </button>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="finalize-section">
                      <button className="btn-finalize" onClick={handleFinalizePredictions}>
                        ✓ Finalizar votación y calcular resultados
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {match.status === 'resolved' && (
            <div className="results-section">
              <h3>Resultados finales</h3>
              {predictions.length > 0 && (
                <div className="results-by-category">
                  {categories
                    .filter((cat) => predictions.some((p) => p.category_id === cat.id))
                    .map((category) => {
                      const categoryPredictions = predictions.filter(
                        (p) => p.category_id === category.id
                      );
                      return (
                        <div key={category.id} className="category-results">
                          <h4>{category.name}</h4>
                          {voteResults[category.id]?.length > 0 && (
                          <div className="voting-summary">
                            <h5>Votos</h5>
                            {voteResults[category.id].map((result, idx) => (
                              <div key={idx} className="result-bar">
                                {result.picture_url && (
                                  <img src={result.picture_url} alt={result.player_name} />
                                )}
                                <span className="result-name">
                                  {result.player_name || 'Otro'}
                                </span>
                                <div className="result-bar-container">
                                  <div
                                    className="result-bar-fill"
                                    style={{ width: `${result.percentage}%` }}
                                  />
                                </div>
                                <span className="result-percentage">
                                  {result.vote_count} ({result.percentage}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {categoryPredictions.length > 0 && (
                          <div className="predictions-verdict">
                            <h5>Predicciones</h5>
                            {categoryPredictions.map((pred) => (
                              <div key={pred.id} className="prediction-verdict-item">
                                <div className="prediction-info">
                                  <strong>{pred.user_name}</strong>: {pred.prediction_text}
                                </div>
                                <div className="verdict-badge">
                                  {pred.is_correct ? (
                                    <span className="correct">✓ Acertó</span>
                                  ) : (
                                    <span className="incorrect">✗ No acertó</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {playerRatings && playerRatings.length > 0 && (
                <div className="player-ratings-summary">
                  <h3>Calificaciones de jugadores</h3>
                  <div className="ratings-grid">
                    {playerRatings.map((rating) => (
                      <div key={rating.player_id} className="rating-summary-card">
                        {rating.picture_url && (
                          <img src={rating.picture_url} alt={rating.name} />
                        )}
                        <h5>{rating.name}</h5>
                        <p className="rating-average">
                          {(parseFloat(rating.average_rating) || 0).toFixed(1)} ⭐
                        </p>
                        <p className="rating-count">({rating.rating_count || 0} votos)</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GroupPage;
